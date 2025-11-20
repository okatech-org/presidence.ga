/**
 * Gestionnaire global pour forcer la reprise des AudioContext
 * Solution basée sur https://developer.chrome.com/blog/web-audio-autoplay
 */

// Tableau de tous les AudioContext à reprendre
const audioContextList: AudioContext[] = [];

// Tous les événements d'interaction utilisateur à écouter
const userInputEventNames = [
  'click',
  'contextmenu',
  'auxclick',
  'dblclick',
  'mousedown',
  'mouseup',
  'pointerup',
  'touchend',
  'keydown',
  'keyup',
];

// Fonction pour reprendre tous les AudioContext
function resumeAllContexts() {
  console.log('🔊 [AudioManager] Tentative de reprise de', audioContextList.length, 'AudioContext...');
  
  let runningCount = 0;
  audioContextList.forEach((context, index) => {
    console.log(`🔊 [AudioManager] AudioContext ${index} état:`, context.state);
    
    if (context.state !== 'running') {
      context.resume()
        .then(() => {
          console.log(`✅ [AudioManager] AudioContext ${index} repris avec succès`);
        })
        .catch(err => {
          console.error(`❌ [AudioManager] Erreur reprise AudioContext ${index}:`, err);
        });
    } else {
      runningCount++;
    }
  });

  // Si tous les contextes sont en cours d'exécution, retirer les écouteurs
  if (runningCount === audioContextList.length && audioContextList.length > 0) {
    console.log('✅ [AudioManager] Tous les AudioContext sont actifs, nettoyage des écouteurs');
    userInputEventNames.forEach(eventName => {
      document.removeEventListener(eventName, resumeAllContexts);
    });
  }
}

// Fonction pour enregistrer un AudioContext
export function registerAudioContext(context: AudioContext) {
  if (!audioContextList.includes(context)) {
    console.log('📝 [AudioManager] Enregistrement nouveau AudioContext, total:', audioContextList.length + 1);
    audioContextList.push(context);
    
    // Tenter de reprendre immédiatement
    if (context.state === 'suspended') {
      context.resume()
        .then(() => console.log('✅ [AudioManager] AudioContext repris immédiatement'))
        .catch(() => console.log('⚠️ [AudioManager] AudioContext nécessite interaction utilisateur'));
    }
  }
}

// Initialiser les écouteurs d'événements au chargement
let initialized = false;

export function initAudioContextManager() {
  if (initialized) return;
  
  console.log('🎬 [AudioManager] Initialisation du gestionnaire AudioContext...');
  
  // Écouter TOUTES les interactions utilisateur
  userInputEventNames.forEach(eventName => {
    document.addEventListener(eventName, resumeAllContexts, { passive: true });
  });
  
  // Proxy pour intercepter la création des AudioContext
  if (typeof window !== 'undefined' && window.AudioContext) {
    const OriginalAudioContext = window.AudioContext;
    
    // @ts-ignore - Override global
    window.AudioContext = new Proxy(OriginalAudioContext, {
      construct(target, args) {
        console.log('🎯 [AudioManager] Création AudioContext interceptée');
        const context = new target(...args);
        registerAudioContext(context);
        return context;
      },
    });
  }
  
  initialized = true;
  console.log('✅ [AudioManager] Gestionnaire initialisé');
}

// Fonction pour forcer la reprise manuelle
export function forceResumeAllAudioContexts() {
  resumeAllContexts();
}
