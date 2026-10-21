# CityCare Clinic

The Streamlit clinic website and appointment system. It follows the supplied
Plasery template's centered branding, terracotta palette, and split hero layout.
Its database is kept in `clinic.db`; the original clinic-site template remains in
the sibling `clinic-website` folder.

Run from this directory:

```powershell
python -m pip install -r requirements.txt
streamlit run streamlit_app.py
```

Appointment times in this prototype are sample schedule data. The live site
includes doctor information and fees, booking, clinic FAQs, contact details,
the clinic assistant, and a doctor appointment panel.

## AI clinic agents

The Doctors and Fees and Clinic Information options use LangChain agents with
Groq's `ChatGroq` integration and read-only tools for the clinic's doctor list,
clinic details, and sample slot availability. They also read
`CityCare_Clinic_Information_Guide.docx` as clinic knowledge. Appointment
booking and cancellation continue through the validated local workflow in
`chatbot.py`.

Install the added SDK dependency with `python -m pip install -r requirements.txt`.
Add your Groq API key to `.env` in this folder (the file is ignored by Git):

```dotenv
GROQ_API_KEY=your-api-key
```

Restart Streamlit after saving the key. You can optionally set `GROQ_MODEL`
to select another Groq-supported model. Keep API keys private. AI chat messages
are sent to Groq; common booking references and phone numbers are redacted
before sending.
