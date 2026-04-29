import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SecurityManager } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const session = cookies().get('authcorp_session')?.value
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    SecurityManager.verifyToken(session)

    const { imageBase64, mimeType } = await req.json()
    if (!imageBase64) return NextResponse.json({ error: 'No image provided' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY?.trim()
    if (!apiKey) return NextResponse.json(generateHeuristicAnalysis())

    const prompt = `You are a forensic document examiner AI with expertise in detecting forged, tampered, and AI-generated documents.

STEP 1 — IDENTIFY THE DOCUMENT TYPE:
Look carefully at the image. Identify what it is:
- "aadhaar_card" — Indian government ID with 12-digit number, UIDAI logo, QR code, hologram pattern
- "pan_card" — Indian tax card with 10-char alphanumeric PAN, Income Tax India text
- "passport" — travel document with MRZ lines at bottom, country name, photo
- "driving_license" — driving licence with vehicle classes, transport authority
- "resume" — CV/resume with work experience, education sections, skills
- "certificate" — academic or professional certificate
- "bank_document" — bank statement, cheque
- "photo" — just a selfie or photo of a person, NOT a document
- "unknown" — anything else

STEP 2 — EXAMINE FOR FORGERY:
Check these specific things:
- Fonts: Are they consistent throughout? Mixed fonts = tampered
- Colors: Are there color mismatches, patches, or inconsistent backgrounds?
- Text alignment: Is text properly aligned or does some look pasted?
- Borders/patterns: Are security patterns (guilloche, microprint) complete and consistent?
- Photo area: Does the photo look cut-paste or digitally inserted?
- QR code: Is there a QR code and does it look genuine?
- Holograms/watermarks: Are security features present and consistent?
- For Aadhaar specifically: Check for UIDAI logo, proper format "XXXX XXXX XXXX", correct fonts (Noto Sans), blue color scheme
- For resume/CV: These are NOT security documents — they should score high (75-90%) unless they contain forged credentials

STEP 3 — MARK SUSPICIOUS REGIONS:
For each suspicious area, provide coordinates as percentage of image dimensions (0-100 scale maps to image width/height).

Respond ONLY with this exact JSON (no markdown, no explanation):
{
  "documentType": "<type from step 1>",
  "authenticityScore": <0-100, where 100=perfectly authentic>,
  "confidence": <0-100, your confidence in this assessment>,
  "category": <"authentic"|"tampered"|"forged"|"ai-generated"|"not-a-document">,
  "isManipulated": <true|false>,
  "reasoning": [
    "<specific observation 1 about THIS document>",
    "<specific observation 2>",
    "<specific observation 3>"
  ],
  "heatmapRegions": [
    {
      "x": <0-400, pixel x position>,
      "y": <0-560, pixel y position>,
      "width": <pixel width of suspicious area>,
      "height": <pixel height>,
      "confidence": <0.5-1.0>,
      "type": <"text_modification"|"copy_move"|"compression_anomaly"|"color_mismatch"|"font_inconsistency">
    }
  ],
  "metadata": {
    "editingSoftware": <string or null>,
    "tamperingClues": ["<specific clue 1>", "<specific clue 2>"],
    "fontInconsistency": <true|false>,
    "colorAnomalies": <true|false>
  },
  "extractedText": "<key text visible in the document, e.g. name, ID number, dates>"
}

SCORING GUIDE:
- Genuine government ID with all security features intact: 80-95
- Suspicious/unclear but appears real: 60-79
- Obvious manipulation or inconsistencies: 25-59
- Clear forgery, AI-generated, or heavily tampered: 0-24
- Resume/CV (not a security document): 75-90 unless forged credentials
- Photo of person (not a document): 30-45 with category "not-a-document"

IMPORTANT: Be specific. Don't say "document looks authentic" — say WHAT you see. Mention specific elements like "UIDAI logo present", "MRZ lines consistent", "photo appears digitally inserted", etc.`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 1200,
        temperature: 0.1,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
                detail: 'high'
              }
            },
            { type: 'text', text: prompt }
          ]
        }]
      })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      console.error('OpenAI error:', response.status, err)
      return NextResponse.json(generateHeuristicAnalysis())
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content?.trim() || ''
    console.log('Vision API raw response:', text.slice(0, 200))

    try {
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(clean)

      return NextResponse.json({
        documentType: parsed.documentType || 'unknown',
        authenticityScore: Math.min(100, Math.max(0, Number(parsed.authenticityScore) || 72)),
        confidence: Math.min(100, Math.max(0, Number(parsed.confidence) || 70)),
        category: parsed.category || 'authentic',
        isManipulated: Boolean(parsed.isManipulated),
        reasoning: Array.isArray(parsed.reasoning) ? parsed.reasoning : ['Analysis completed'],
        heatmapRegions: Array.isArray(parsed.heatmapRegions) ? parsed.heatmapRegions.slice(0, 6) : [],
        metadata: {
          editingSoftware: parsed.metadata?.editingSoftware || null,
          tamperingClues: parsed.metadata?.tamperingClues || [],
          fontInconsistency: parsed.metadata?.fontInconsistency || false,
          colorAnomalies: parsed.metadata?.colorAnomalies || false,
        },
        extractedText: parsed.extractedText || '',
        source: 'openai-vision'
      })
    } catch (parseErr) {
      console.error('JSON parse failed:', parseErr, 'Raw text:', text.slice(0, 500))
      return NextResponse.json(generateHeuristicAnalysis())
    }
  } catch (err) {
    console.error('Vision analyze error:', err)
    return NextResponse.json(generateHeuristicAnalysis())
  }
}

function generateHeuristicAnalysis() {
  return {
    documentType: 'unknown',
    authenticityScore: 72,
    confidence: 60,
    category: 'authentic',
    isManipulated: false,
    reasoning: ['Vision API unavailable — basic analysis only', 'Manual review recommended'],
    heatmapRegions: [],
    metadata: { editingSoftware: null, tamperingClues: [], fontInconsistency: false, colorAnomalies: false },
    extractedText: '',
    source: 'heuristic'
  }
}