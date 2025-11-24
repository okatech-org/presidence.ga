"""
Web Intelligence Scraper (Project Lynx Eye)

Ce script Python est destiné à tourner périodiquement (ex: cron job toutes les 6h).
Il scrape le web et YouTube pour des mots-clés spécifiques et envoie les résultats à Supabase.

Installation:
pip install supabase duckduckgo-search youtube-search-python python-dotenv
"""

import os
import time
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client, Client
from duckduckgo_search import DDGS
from youtubesearchpython import VideosSearch

load_dotenv()

# Configuration Supabase
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(url, key)

KEYWORDS = ["Gabon économie", "Politique Gabon", "Investissement Gabon", "Oligui Nguema", "CTRI Gabon"]

def scrape_web():
    print("🕷️  Démarrage du scraping Web...")
    with DDGS() as ddgs:
        for keyword in KEYWORDS:
            print(f"   Recherche: {keyword}")
            results = ddgs.text(keyword, region='fr-fr', safesearch='off', timelimit='d', max_results=5)
            
            for r in results:
                save_to_supabase(
                    content=f"{r['title']}\n\n{r['body']}\n\nSource: {r['href']}",
                    author="web_search",
                    external_id=r['href'],
                    category="autre"
                )
                time.sleep(1) # Politesse

def scrape_youtube():
    print("📺 Démarrage du scraping YouTube...")
    search = VideosSearch('Gabon actualité', limit = 10)
    results = search.result()['result']

    for video in results:
        # Filtrer les vidéos récentes (moins de 24h idéalement, ici on prend tout le flux récent)
        content = f"Titre: {video['title']}\nChaîne: {video['channel']['name']}\nLien: {video['link']}\nDescription: {video.get('descriptionSnippet', [{'text': ''}])[0]['text']}"
        
        save_to_supabase(
            content=content,
            author=f"youtube_{video['channel']['name']}",
            external_id=video['id'],
            category="social"
        )

def save_to_supabase(content, author, external_id, category):
    try:
        data = {
            "content": content,
            "author": author,
            "external_id": external_id,
            "category": category,
            "summary": "En attente d'analyse IA...",
            "published_at": datetime.utcnow().isoformat()
        }
        
        # Upsert pour éviter les doublons (basé sur external_id si contrainte unique)
        # Note: Assurez-vous d'avoir une contrainte unique sur (source_id, external_id) ou juste external_id
        response = supabase.table("intelligence_items").upsert(data, on_conflict="external_id").execute()
        print(f"   ✅ Sauvegardé: {external_id[:20]}...")
    except Exception as e:
        print(f"   ❌ Erreur sauvegarde: {e}")

if __name__ == "__main__":
    print("--- Lancement de la mission Oeil de Lynx ---")
    scrape_web()
    scrape_youtube()
    print("--- Mission terminée ---")
