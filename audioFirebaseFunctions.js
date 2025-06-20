// audioFirebaseFunctions.js
// Tento soubor obsahuje Firebase logiku pro audio přehrávač.

// !!! Zde je tvůj konfigurační objekt, který jsi mi poslal !!!
const firebaseConfig = {
    apiKey: "AIzaSyCxO2BdPLkvRW9q3tZTW5J39pjjAoR-9Sk", // Tvoje API Key
    authDomain: "audio-prehravac-v-3.firebaseapp.com", // Tvoje Auth Domain
    projectId: "audio-prehravac-v-3", // Tvoje Project ID
    storageBucket: "audio-prehravac-v-3.firebasestorage.app", // Tvoje Storage Bucket
    messagingSenderId: "343140348126", // Tvoje Messaging Sender ID
    appId: "1:343140348126:web:c61dc969efb6dcb547524f" // Tvoje App ID
    //measurementId: "G-6QSYEY22N6" // Pokud nepoužíváš Analytics, může být zakomentováno
};

// Log pro potvrzení, že firebaseConfig byl načten
console.log("audioFirebaseFunctions.js: Konfigurační objekt Firebase načten a připraven.", firebaseConfig.projectId);

let db; // Proměnná pro instanci Firestore databáze

// Inicializace Firebase aplikace a Firestore databáze
// Nyní asynchronní, aby počkala na plné načtení Firebase SDK
window.initializeFirebaseAppAudio = async function() {
    console.log("audioFirebaseFunctions.js: Spuštěna inicializace Firebase aplikace pro audio přehrávač.");

    return new Promise((resolve, reject) => {
        const checkFirebaseReady = setInterval(() => {
            // Kontrolujeme, zda jsou globální objekty a metody Firebase plně načteny
            if (typeof firebase !== 'undefined' && typeof firebase.initializeApp === 'function' && typeof firebase.firestore === 'function') {
                clearInterval(checkFirebaseReady); // Zastavíme kontrolu, Firebase je připraveno
                console.log("audioFirebaseFunctions.js: Firebase SDK (app & firestore) detekováno a připraveno.");
                
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                    console.log("audioFirebaseFunctions.js: Firebase aplikace inicializována.");
                } else {
                    console.log("audioFirebaseFunctions.js: Firebase aplikace již byla inicializována (přeskakuji).");
                }
                
                db = firebase.firestore();
                console.log("audioFirebaseFunctions.js: Firestore databáze připravena pro audio přehrávač.");
                resolve(true); // Signalizuje úspěšnou inicializaci
            } else {
                console.log("audioFirebaseFunctions.js: Čekám na načtení Firebase SDK (včetně firestore modulu)...");
            }
        }, 100); // Kontrolujeme každých 100ms
    });
};

// --- FUNKCE PRO UKLÁDÁNÍ DAT DO FIRESTORE ---

// Ukládá celý playlist do Firestore
window.savePlaylistToFirestore = async function(playlistArray) {
    console.log("audioFirebaseFunctions.js: Pokus o uložení playlistu do Firestore.", playlistArray);
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit playlist.");
        // Voláme globální showNotification, která by měla být definována v index.html
        window.showNotification("Chyba: Databáze není připravena k uložení playlistu!", 'error');
        throw new Error("Firestore databáze není připravena k uložení playlistu.");
    }

    // Pro jednoduchost uložíme celý playlist jako jeden dokument.
    // POZOR: Firestore dokument má limit 1MB. Pokud máš 358 písniček s dlouhými URL/tituly,
    // mohl by to být problém. Pokud ano, museli bychom to rozdělit na více dokumentů/subkolekce.
    const playlistDocRef = db.collection('audioPlaylists').doc('mainPlaylist'); 
    
    try {
        await playlistDocRef.set({ tracks: playlistArray }); // Uloží pole skladeb pod klíčem 'tracks'
        console.log("audioFirebaseFunctions.js: Playlist úspěšně uložen do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání playlistu do Firestore:", error);
        window.showNotification("Chyba při ukládání playlistu do cloudu!", 'error');
        throw error;
    }
};

// Ukládá oblíbené skladby do Firestore
window.saveFavoritesToFirestore = async function(favoritesArray) {
    console.log("audioFirebaseFunctions.js: Pokus o uložení oblíbených do Firestore.", favoritesArray);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit oblíbené.");
        window.showNotification("Chyba: Databáze není připravena k uložení oblíbených!", 'error');
        throw new Error("Firestore databáze není připravena k uložení oblíbených.");
    }

    const favoritesDocRef = db.collection('audioPlayerSettings').doc('favorites'); 
    
    try {
        await favoritesDocRef.set({ titles: favoritesArray }, { merge: true }); 
        console.log("audioFirebaseFunctions.js: Oblíbené skladby úspěšně uloženy do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání oblíbených do Firestore:", error);
        window.showNotification("Chyba při ukládání oblíbených do cloudu!", 'error');
        throw error;
    }
};

// Ukládá nastavení přehrávače (např. shuffle, loop, lastPlayedIndex) do Firestore
window.savePlayerSettingsToFirestore = async function(settingsObject) {
    console.log("audioFirebaseFunctions.js: Pokus o uložení nastavení přehrávače do Firestore.", settingsObject);
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze uložit nastavení přehrávače.");
        window.showNotification("Chyba: Databáze není připravena k uložení nastavení přehrávače!", 'error');
        throw new Error("Firestore databáze není připravena k uložení nastavení přehrávače.");
    }

    const playerSettingsDocRef = db.collection('audioPlayerSettings').doc('mainSettings'); 
    
    try {
        await playerSettingsDocRef.set(settingsObject, { merge: true }); 
        console.log("audioFirebaseFunctions.js: Nastavení přehrávače úspěšně uložena do Firestore.");
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při ukládání nastavení přehrávače do Firestore:", error);
        window.showNotification("Chyba při ukládání nastavení přehrávače do cloudu!", 'error');
        throw error;
    }
};


// --- FUNKCE PRO NAČÍTÁNÍ DAT Z FIRESTORE ---

// Načítá playlist z Firestore
window.loadPlaylistFromFirestore = async function() {
    console.log("audioFirebaseFunctions.js: Pokus o načtení playlistu z Firestore.");
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst playlist.");
        return null; 
    }

    try {
        const doc = await db.collection('audioPlaylists').doc('mainPlaylist').get();
        if (doc.exists && doc.data().tracks) {
            console.log("audioFirebaseFunctions.js: Playlist úspěšně načten z Firestore.", doc.data().tracks.length, "skladeb.");
            return doc.data().tracks; 
        } else {
            console.log("audioFirebaseFunctions.js: Dokument s playlistem 'mainPlaylist' neexistuje nebo je prázdný.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání playlistu z Firestore:", error);
        window.showNotification("Chyba při načítání playlistu z cloudu!", 'error');
        throw error;
    }
};

// Načítá oblíbené skladby z Firestore
window.loadFavoritesFromFirestore = async function() {
    console.log("audioFirebaseFunctions.js: Pokus o načtení oblíbených z Firestore.");
    if (!db) {
       // console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst oblíbené.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('favorites').get();
        if (doc.exists && doc.data().titles) {
            console.log("audioFirebaseFunctions.js: Oblíbené skladby úspěšně načteny z Firestore.", doc.data().titles.length, "oblíbených.");
            return doc.data().titles; 
        } else {
            console.log("audioFirebaseFunctions.js: Dokument s oblíbenými 'favorites' neexistuje nebo je prázdný.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání oblíbených z Firestore:", error);
        window.showNotification("Chyba při načítání oblíbených z cloudu!", 'error');
        throw error;
    }
};

// Načítá nastavení přehrávače z Firestore
window.loadPlayerSettingsFromFirestore = async function() {
    console.log("audioFirebaseFunctions.js: Pokus o načtení nastavení přehrávače z Firestore.");
    if (!db) {
        //console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze načíst nastavení přehrávače.");
        return null;
    }

    try {
        const doc = await db.collection('audioPlayerSettings').doc('mainSettings').get();
        if (doc.exists) {
            console.log("audioFirebaseFunctions.js: Nastavení přehrávače úspěšně načtena z Firestore.", doc.data());
            return doc.data(); 
        } else {
            console.log("audioFirebaseFunctions.js: Dokument s nastavením přehrávače 'mainSettings' neexistuje.");
            return null;
        }
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při načítání nastavení přehrávače z Firestore:", error);
        window.showNotification("Chyba při načítání nastavení přehrávače z cloudu!", 'error');
        throw error;
    }
};


// --- FUNKCE PRO SMAZÁNÍ DAT Z FIRESTORE (POZOR! DŮRAZNĚ!) ---

// Funkce pro smazání všech dat ze všech kolekcí audio přehrávače
window.clearAllAudioFirestoreData = async function() {
    console.log("audioFirebaseFunctions.js: Pokus o smazání VŠECH dat audio přehrávače z Firestore (všechny určené kolekce).");
    if (!db) {
        console.error("audioFirebaseFunctions.js: Firestore databáze není inicializována, nelze smazat všechna data.");
        window.showNotification("Chyba: Databáze není připravena k mazání všech dat!", 'error');
        throw new Error("Firestore databáze není připravena ke smazání všech dat.");
    }

    try {
        const collectionsToClear = ['audioPlaylists', 'audioPlayerSettings']; // Kolekce specifické pro audio přehrávač
        let totalDeletedCount = 0;

        for (const collectionName of collectionsToClear) {
            console.log(`audioFirebaseFunctions.js: Spouštím mazání dokumentů z kolekce '${collectionName}'.`);
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            const batch = db.batch();
            let deletedInCollection = 0;

            if (snapshot.size === 0) {
                console.log(`audioFirebaseFunctions.js: Kolekce '${collectionName}' je již prázdná.`);
                continue; 
            }

            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                deletedInCollection++;
            });

            console.log(`audioFirebaseFunctions.js: Přidáno ${deletedInCollection} dokumentů z kolekce '${collectionName}' do dávky pro smazání.`);
            await batch.commit();
            console.log(`audioFirebaseFunctions.js: Smazáno ${deletedInCollection} dokumentů z kolekce '${collectionName}'.`);
            totalDeletedCount += deletedInCollection;
        }
        
        console.log(`audioFirebaseFunctions.js: Všechna data audio přehrávače z Firestore úspěšně smazána. Celkem smazáno: ${totalDeletedCount} dokumentů.`);
        return true;
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při mazání všech dat z Firestore:", error);
        window.showNotification("Chyba při mazání všech dat z cloudu!", 'error');
        throw error;
    }
};

// tady je funkce pro reset a znovu načtení? 

// --- FUNKCE PRO RESET A RESYNCHRONIZACI VŠECH ALGORITMŮ ---

// Funkce pro kompletní reset a znovu načtení všech dat bez mazání z Firebase
window.resetAndResyncAllAlgorithms = async function() {
    console.log("audioFirebaseFunctions.js: Spouštím kompletní reset a resynchronizaci všech algoritmů.");
    
    try {
        // Zobrazíme notifikaci o zahájení procesu
        window.showNotification("🔄 Spouštím resynchronizaci všech dat...", 'info');
        
        // 1. Resetujeme lokální proměnné přehrávače (pokud existují globálně)
        if (typeof window.currentTrackIndex !== 'undefined') window.currentTrackIndex = 0;
        if (typeof window.isPlaying !== 'undefined') window.isPlaying = false;
        if (typeof window.isShuffled !== 'undefined') window.isShuffled = false;
        if (typeof window.isLooped !== 'undefined') window.isLooped = false;
        
        console.log("audioFirebaseFunctions.js: Lokální proměnné přehrávače resetovány.");
        
        // 2. Znovu načteme playlist z Firebase
        const playlistData = await window.loadPlaylistFromFirestore();
        if (playlistData && Array.isArray(playlistData)) {
            // Pokud máš globální playlist proměnnou, aktualizuj ji
            if (typeof window.playlist !== 'undefined') {
                window.playlist = playlistData;
                console.log("audioFirebaseFunctions.js: Playlist znovu načten z Firebase:", playlistData.length, "skladeb.");
            }
        }
        
        // 3. Znovu načteme oblíbené z Firebase
        const favoritesData = await window.loadFavoritesFromFirestore();
        if (favoritesData && Array.isArray(favoritesData)) {
            // Pokud máš globální favorites proměnnou, aktualizuj ji
            if (typeof window.favorites !== 'undefined') {
                window.favorites = favoritesData;
                console.log("audioFirebaseFunctions.js: Oblíbené znovu načteny z Firebase:", favoritesData.length, "položek.");
            }
        }
        
        // 4. Znovu načteme nastavení přehrávače z Firebase
        const settingsData = await window.loadPlayerSettingsFromFirestore();
        if (settingsData && typeof settingsData === 'object') {
            // Aplikujeme nastavení zpět do přehrávače
            if (settingsData.shuffle !== undefined && typeof window.isShuffled !== 'undefined') {
                window.isShuffled = settingsData.shuffle;
            }
            if (settingsData.loop !== undefined && typeof window.isLooped !== 'undefined') {
                window.isLooped = settingsData.loop;
            }
            if (settingsData.lastPlayedIndex !== undefined && typeof window.currentTrackIndex !== 'undefined') {
                window.currentTrackIndex = settingsData.lastPlayedIndex;
            }
            console.log("audioFirebaseFunctions.js: Nastavení přehrávače znovu načtena z Firebase:", settingsData);
        }
        
        // 5. Obnovíme UI komponenty (pokud existují odpovídající funkce)
        if (typeof window.updatePlaylistDisplay === 'function') {
            window.updatePlaylistDisplay();
            console.log("audioFirebaseFunctions.js: Playlist UI obnoveno.");
        }
        
        if (typeof window.updateFavoritesDisplay === 'function') {
            window.updateFavoritesDisplay();
            console.log("audioFirebaseFunctions.js: Oblíbené UI obnoveno.");
        }
        
        if (typeof window.updatePlayerUI === 'function') {
            window.updatePlayerUI();
            console.log("audioFirebaseFunctions.js: Přehrávač UI obnoven.");
        }
        
        // 6. Zastavíme současné přehrávání a resetujeme audio element
        if (typeof window.audioElement !== 'undefined' && window.audioElement) {
            window.audioElement.pause();
            window.audioElement.currentTime = 0;
            console.log("audioFirebaseFunctions.js: Audio element resetován.");
        }
        
        // 7. Načteme první skladbu (nebo poslední přehrávanou podle nastavení)
        if (typeof window.loadTrack === 'function' && typeof window.currentTrackIndex !== 'undefined') {
            window.loadTrack(window.currentTrackIndex);
            console.log("audioFirebaseFunctions.js: Skladba znovu načtena na index:", window.currentTrackIndex);
        }
        
        console.log("audioFirebaseFunctions.js: Kompletní reset a resynchronizace úspěšně dokončena!");
        window.showNotification("✅ Všechna data úspěšně znovu načtena a resynchronizována!", 'success');
        
        return true;
        
    } catch (error) {
        console.error("audioFirebaseFunctions.js: Chyba při resetu a resynchronizaci:", error);
        window.showNotification("❌ Chyba při resynchronizaci dat!", 'error');
        throw error;
    }
};

// --- FUNKCE PRO SMAZÁNÍ DAT Z FIRESTORE (POZOR! DŮRAZNĚ!) ---

// Funkce pro smazání všech dat ze všech kolekcí audio přehrávače
window.clearAllAudioFirestoreData = async function() {
