import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// Initialize Gemini client (reads GEMINI_API_KEY from environment)
const getAiClient = () => {
  return new GoogleGenAI();
};

// Default coordinates for CityCare Clinic in Karond, Bhopal, MP, India
const CITYCARE_COORDS = {
  latitude: 23.2965,
  longitude: 77.4065,
};

// Server-side Gemini Maps Grounding endpoint
app.post('/api/maps-grounding', async (req: express.Request, res: express.Response) => {
  try {
    const { query, latLng } = req.body;
    const userQuery = query || 'Find pharmacies, diagnostic centers, and landmarks near CityCare Clinic Karond Bhopal';
    const coords = latLng || CITYCARE_COORDS;

    const ai = getAiClient();
    const systemPrompt = `You are CityCare Clinic's navigation and local health services guide in Karond, Bhopal (Address: Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal, PIN 462038). 
Provide accurate, up-to-date geographical and place information for patients and visitors using Google Maps data. 
Mention exact landmarks, road access (Karond Square, Berasia Road, Saeed Colony, Housing Board), and nearby healthcare amenities (pharmacies, medical stores, pathology labs).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `${systemPrompt}\n\nUser Question: ${userQuery}`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: Number(coords.latitude) || CITYCARE_COORDS.latitude,
              longitude: Number(coords.longitude) || CITYCARE_COORDS.longitude,
            },
          },
        },
      },
    });

    const candidate = response.candidates?.[0];
    const text = response.text || '';
    const groundingChunks = candidate?.groundingMetadata?.groundingChunks || [];
    const webSearchQueries = candidate?.groundingMetadata?.webSearchQueries || [];

    return res.json({
      success: true,
      text,
      groundingChunks,
      webSearchQueries,
    });
  } catch (err: any) {
    console.error('Error in /api/maps-grounding:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to query Google Maps grounding',
      fallback: {
        text: 'CityCare Clinic is located at Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal (462038). Located conveniently off the main Karond-Berasia Road with dedicated patient parking and wheelchair accessibility.',
        place: {
          title: 'CityCare Clinic Karond Bhopal',
          address: 'Shop No. 4, near Saeed Colony, Housing Board, Karond, Bhopal',
          uri: 'https://maps.google.com/?q=Shop+No.+4,+near+Saeed+Colony,+Housing+Board,+Karond,+Bhopal',
        },
      },
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req: express.Request, res: express.Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Vite Middleware for Development or Static serving for Production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req: express.Request, res: express.Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CityCare Clinic server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
