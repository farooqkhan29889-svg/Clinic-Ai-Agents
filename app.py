import os
import subprocess
import streamlit as st
import streamlit.components.v1 as components

# Configure page metadata and wide layout
st.set_page_config(
    page_title="ApexCare AI Medical Clinic",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Custom CSS to provide full-width immersive experience
st.markdown(
    """
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        [data-testid="stToolbar"] {visibility: hidden;}
        .block-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
        }
        iframe {
            border: none !important;
            width: 100% !important;
            min-height: 100vh !important;
            height: 100vh !important;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

current_dir = os.path.dirname(os.path.abspath(__file__))
dist_dir = os.path.join(current_dir, "dist")
index_file = os.path.join(dist_dir, "index.html")

# Auto-build production assets if dist does not exist
if not os.path.exists(index_file):
    with st.spinner("Preparing ApexCare AI Medical Clinic (first-time launch)..."):
        try:
            if not os.path.exists(os.path.join(current_dir, "node_modules")):
                subprocess.run(["npm", "install", "--include=dev"], cwd=current_dir, check=False)
            subprocess.run(["npm", "run", "build"], cwd=current_dir, check=True)
        except Exception as e:
            st.error(f"Build failed: {e}")

if os.path.exists(index_file):
    try:
        clinic_component = components.declare_component("apexcare_clinic", path=dist_dir)
        clinic_component()
    except Exception:
        with open(index_file, "r", encoding="utf-8") as f:
            html_content = f.read()
        components.html(html_content, height=1000, scrolling=True)
else:
    st.error("Application build not found. Please run 'npm run build' and retry.")
