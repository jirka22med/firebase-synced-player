// --- Globální proměnné a konstanty ---



const audioPlayer = document.getElementById('audioPlayer');



const audioSource = document.getElementById('audioSource');



const trackTitleElement = document.getElementById('trackTitle'); 



const progressBar = document.getElementById('progress-bar');



const currentTimeDisplay = document.getElementById('currentTime').querySelectorAll('.time-part');



const durationDisplayElement = document.getElementById('duration').querySelectorAll('.time-part'); 



const playButton = document.getElementById('play-button');



const pauseButton = document.getElementById('pause-button');



const prevButton = document.getElementById('prev-button');



const nextButton = document.getElementById('next-button');



const loopButton = document.getElementById('loop-button');



const shuffleButton = document.getElementById('shuffle-button');



const resetButton = document.getElementById('reset-button');



const fullscreenToggleButton = document.getElementById('fullscreen-toggle'); 



const toggleInfoButton = document.getElementById('toggle-info-button');



const reloadButton = document.getElementById('reload-button');



const togglePlaylistButton = document.getElementById('toggle-playlist-button');



const playlistElement = document.getElementById('playlist'); 



const popiskyElement = document.getElementById('popisky'); 



const volumeSlider = document.getElementById('volume-slider');



const volumeValueElement = document.getElementById('volume-value'); 



const muteButton = document.getElementById('mute-button');



const clockHours = document.querySelector('.time .hours');



const clockMinutes = document.querySelector('.time .minutes');



const clockSeconds = document.querySelector('.time .seconds');



const currentDateElement = document.getElementById('currentDate');



const favoritesButton = document.createElement('button'); // Vytvoření tlačítka pro oblíbené







// Globální proměnné pro stav přehrávače a data (inicializovány jako prázdné/výchozí, budou načteny)



let currentTrackIndex = 0;



let isShuffled = false;



let shuffledIndices = [];



let favorites = []; // Bude inicializováno z úložiště



let originalTracks; // Bude inicializováno z window.tracks v loadAudioData



let currentPlaylist = []; 







// --- Seznam skladeb (TVŮJ HLAVNÍ HARDCODED PLAYLIST) ---



// Tuto proměnnou NEMĚNÍM. Bude sloužit jako konečný fallback, pokud se nic nenačte z Firebase/LocalStorage.



// Předpokládáme, že `window.tracks` je definováno globálně v HTML PŘED TÍMTO skriptem.



// Pokud není definováno globálně nebo není pole, zde se vytvoří prázdné pole, které bude použito jako ultimate fallback.



if (typeof window.tracks === 'undefined' || !Array.isArray(window.tracks)) {



    console.warn("audioPlayer.js: Globální proměnná 'window.tracks' není definována nebo není pole. Používám prázdný playlist jako základ.");



    // Důležité: Pokud window.tracks neexistuje, vytvoříme ho s prázdným polem



    // aby se přehrávač nespustil prázdný při prvním načtení bez dat z cloudu.



    window.tracks = []; // Zde je oprava: Zajistíme, že window.tracks je pole



}











// --- Funkce showNotification ---



window.showNotification = function(message, type = 'info', duration = 3000) {



    // Zajišťujeme, že type je vždy string, i když je volán s nedefinovanou hodnotou



    const notificationType = typeof type === 'string' ? type.toUpperCase() : 'INFO'; 



    console.log(`[${notificationType}] ${message}`); 



    const notificationElement = document.getElementById('notification'); 



    if (notificationElement) {



        notificationElement.textContent = message;



        notificationElement.style.display = 'block';



        if (type === 'error') {



            notificationElement.style.backgroundColor = '#dc3545'; 



        } else if (type === 'warn') {



            notificationElement.style.backgroundColor = '#ffc107'; 



        } else {



            notificationElement.style.backgroundColor = '#28a745'; 



        }



        setTimeout(() => {



            notificationElement.style.display = 'none';



        }, duration);



    } else {



        console.warn(`showNotification: UI element #notification nebyl nalezen. Zpráva: ${message}`);



    }



};











// --- Funkce pro čištění a aktualizaci URL adres ---



function checkAndFixTracks(trackList) {



    let fixedUrls = 0;



    if (!Array.isArray(trackList)) {



        console.error("checkAndFixTracks: Seznam skladeb není pole.");



        return;



    }



    trackList.forEach(track => {



        if (track && track.src && track.src.includes("dl=0")) {



            track.src = track.src.replace("dl=0", "dl=1");



            fixedUrls++;



        }



    });



    if (fixedUrls > 0) {



        console.log(`checkAndFixTracks: ✅ Opraveno ${fixedUrls} URL adres v playlistu (Dropbox dl=0 na dl=1).`);



    }



}







// --- Hlavní funkce pro načítání a ukládání všech dat přehrávače ---







async function loadAudioData() {



    console.log("loadAudioData: Spuštěno načítání dat pro audio přehrávač.");







    // Důležité: originalTracks bude nyní vždy odkazovat na window.tracks (buď z myPlaylist.js nebo prázdné pole)



    originalTracks = window.tracks; 



    currentPlaylist = [...originalTracks]; // currentPlaylist je vždy kopie pro shuffle







    let firestorePlaylistLoaded = false;



    let firestoreFavoritesLoaded = false;



    let firestorePlayerSettingsLoaded = false;







    // 2. Pokus o načtení z Firebase Firestore



    try {



        console.log("loadAudioData: Pokouším se načíst playlist z Firestore.");



        const loadedFirestorePlaylist = await window.loadPlaylistFromFirestore();



        if (loadedFirestorePlaylist && loadedFirestorePlaylist.length > 0) {



            window.tracks = loadedFirestorePlaylist; 



            firestorePlaylistLoaded = true;



            checkAndFixTracks(window.tracks); 



            console.log("loadAudioData: Playlist načten z Firestore.");



        } else {



            console.log("loadAudioData: Žádný playlist ve Firestore.");



        }







        console.log("loadAudioData: Pokouším se načíst oblíbené z Firestore.");



        const loadedFirestoreFavorites = await window.loadFavoritesFromFirestore();



        if (loadedFirestoreFavorites && loadedFirestoreFavorites.length > 0) {



            favorites = [...loadedFirestoreFavorites]; 



            firestoreFavoritesLoaded = true;



            console.log("loadAudioData: Oblíbené načteny z Firestore.");



        } else {



            console.log("loadAudioData: Žádné oblíbené ve Firestore.");



        }







        console.log("loadAudioData: Pokouším se načíst nastavení přehrávače z Firestore.");



        const loadedFirestorePlayerSettings = await window.loadPlayerSettingsFromFirestore();



        if (loadedFirestorePlayerSettings) {



            if (loadedFirestorePlayerSettings.isShuffled !== undefined) isShuffled = loadedFirestorePlayerSettings.isShuffled;



            if (loadedFirestorePlayerSettings.loop !== undefined && audioPlayer) audioPlayer.loop = loadedFirestorePlayerSettings.loop;



            if (loadedFirestorePlayerSettings.currentTrackIndex !== undefined) currentTrackIndex = loadedFirestorePlayerSettings.currentTrackIndex;



            if (loadedFirestorePlayerSettings.volume !== undefined && audioPlayer) audioPlayer.volume = loadedFirestorePlayerSettings.volume; 



            if (loadedFirestorePlayerSettings.muted !== undefined && audioPlayer) audioPlayer.muted = loadedFirestorePlayerSettings.muted; 



            



            firestorePlayerSettingsLoaded = true;



            console.log("loadAudioData: Nastavení přehrávače načteno z Firestore.");



        } else {



            console.log("loadAudioData: Žádné nastavení přehrávače ve Firestore.");



        }







    } catch (error) {



        console.error("loadAudioData: Chyba při načítání dat z Firebase Firestore:", error);



        window.showNotification("Chyba při načítání dat z cloudu. Používám lokální data.", 'error'); 



    }







    // 3. Fallback na LocalStorage (pokud Firestore nic nenačetl)



    if (!firestorePlaylistLoaded) {



        console.log("loadAudioData: Firestore playlist nenačten. Pokouším se z LocalStorage.");



        const savedPlaylist = JSON.parse(localStorage.getItem('currentPlaylist') || '[]');



        if (savedPlaylist.length > 0) {



            window.tracks = [...savedPlaylist]; 



            checkAndFixTracks(window.tracks); 



            console.log("loadAudioData: Playlist načten z LocalStorage.");



        } else {



            console.log("loadAudioData: Žádný playlist v LocalStorage.");



        }



    }



    if (!firestoreFavoritesLoaded) {



        console.log("loadAudioData: Firestore oblíbené nenačteny. Pokouším se z LocalStorage.");



        favorites = JSON.parse(localStorage.getItem('favorites') || '[]');



        console.log("loadAudioData: Oblíbené načteny z LocalStorage.");



    }



    if (!firestorePlayerSettingsLoaded) {



        console.log("loadAudioData: Firestore nastavení přehrávače nenačteno. Pokouším se z LocalStorage.");



        const savedPlayerSettings = JSON.parse(localStorage.getItem('playerSettings') || '{}');



        if (savedPlayerSettings.isShuffled !== undefined) isShuffled = savedPlayerSettings.isShuffled;



        if (savedPlayerSettings.loop !== undefined && audioPlayer) audioPlayer.loop = savedPlayerSettings.loop;



        if (savedPlayerSettings.currentTrackIndex !== undefined) currentTrackIndex = savedPlayerSettings.currentTrackIndex;



        if (savedPlayerSettings.volume !== undefined && audioPlayer) audioPlayer.volume = savedPlayerSettings.volume;



        if (savedPlayerSettings.muted !== undefined && audioPlayer) audioPlayer.muted = savedPlayerSettings.muted;



        console.log("loadAudioData: Nastavení přehrávače načteno z LocalStorage.");



    }



    



    // Po všech pokusech o načtení, aktualizujeme originalTracks a currentPlaylist



    // Toto je důležité, aby originalTracks vždy reflektovalo aktuální playlist (z Firebase/LocalStorage/hardcoded)



    originalTracks = window.tracks; 



    currentPlaylist = [...originalTracks];







    // Pokud se data NENAČETLA z Firebase (ale existují lokálně nebo jsou to hardcoded data, která tam nejsou)



    // pak je uložíme do Firebase, aby se synchronizovala



    // Zde je úprava: Zjednodušená podmínka pro ukládání po načtení, pokud Firestore bylo prázdné



    if (!firestorePlaylistLoaded || !firestoreFavoritesLoaded || !firestorePlayerSettingsLoaded) {



        console.log("loadAudioData: Některá data chyběla ve Firestore. Ukládám aktuální stav do cloudu.");



        await saveAudioData(); 



    }







    console.log("loadAudioData: Načítání dat pro audio přehrávač dokončeno. Aktuální playlist délka:", currentPlaylist.length, "Oblíbené:", favorites.length);



}







// Tato funkce ukládá VŠECHNA data (playlist, oblíbené, nastavení přehrávače)



// do LocalStorage a Firebase Firestore



async function saveAudioData() {



    console.log("saveAudioData: Spuštěno ukládání všech dat audio přehrávače do LocalStorage a Firebase.");







    // Ukládání do LocalStorage (pro okamžitou dostupnost a fallback)



    localStorage.setItem('currentPlaylist', JSON.stringify(window.tracks)); // Uloží window.tracks



    localStorage.setItem('favorites', JSON.stringify(favorites)); // Uloží oblíbené



    localStorage.setItem('playerSettings', JSON.stringify({ // Uloží nastavení přehrávače



        currentTrackIndex: currentTrackIndex,



        isShuffled: isShuffled,



        loop: audioPlayer ? audioPlayer.loop : false,



        volume: audioPlayer ? audioPlayer.volume : 0.5, 



        muted: audioPlayer ? audioPlayer.muted : false 



    }));



    console.log("saveAudioData: Data audio přehrávače úspěšně uložena do LocalStorage.");







    // Ukládání do Firebase Firestore



    try {



        console.log("saveAudioData: Pokouším se uložit playlist do Firebase Firestore.");



        await window.savePlaylistToFirestore(window.tracks); // Uloží window.tracks



        console.log("saveAudioData: Playlist úspěšně uložen do Firebase Firestore.");







        console.log("saveAudioData: Pokouším se uložit oblíbené do Firebase Firestore.");



        await window.saveFavoritesToFirestore(favorites);



        console.log("saveAudioData: Oblíbené úspěšně uloženy do Firebase Firestore.");







        console.log("saveAudioData: Pokouším se uložit nastavení přehrávače do Firebase Firestore.");



        await window.savePlayerSettingsToFirestore({



            currentTrackIndex: currentTrackIndex,



            isShuffled: isShuffled,



            loop: audioPlayer ? audioPlayer.loop : false,



            volume: audioPlayer ? audioPlayer.volume : 0.5,



            muted: audioPlayer ? audioPlayer.muted : false



        });



        console.log("saveAudioData: Nastavení přehrávače úspěšně uložena do Firebase Firestore.");







    } catch (error) {



        console.error("saveAudioData: Nepodařilo se uložit data do Firebase Firestore:", error);



        window.showNotification("Chyba: Data přehrávače se nepodařilo uložit do cloudu!", 'error');



    }



    console.log("saveAudioData: Ukládání dat audio přehrávače dokončeno pro všechny cíle.");



}







// Funkce pro smazání všech dat přehrávače (pro tlačítko v aplikaci)



window.clearAllAudioPlayerData = async function() {



    console.log("clearAllAudioPlayerData: Spuštěn proces mazání VŠECH dat audio přehrávače.");



    if (confirm('⚠️ OPRAVDU chcete smazat VŠECHNA data audio přehrávače? Tato akce nelze vrátit zpět!')) {



        if (confirm('⚠️ JSTE SI ABSOLUTNĚ JISTI? Všechna data audio přehrávače budou nenávratně ztracena!')) {



            localStorage.removeItem('currentPlaylist');



            localStorage.removeItem('favorites');



            localStorage.removeItem('playerSettings');



            console.log("clearAllAudioPlayerData: Lokální data audio přehrávače smazána.");



            



            try {



                console.log("clearAllAudioPlayerData: Pokouším se smazat všechna data audio přehrávače z Firebase Firestore.");



                await window.clearAllAudioFirestoreData(); 



                console.log("clearAllAudioPlayerData: Všechna data audio přehrávače úspěšně smazána z Firebase Firestore.");



            } catch (error) {



                console.error("clearAllAudioPlayerData: Chyba při mazání všech dat audio přehrávače z Firebase Firestore:", error);



                window.showNotification("Chyba při mazání dat přehrávače z cloudu! Smažte je prosím ručně v konzoli Firebase.", 'error');



            }







            // Reset globálních proměnných na výchozí hodnoty



            currentTrackIndex = 0;



            isShuffled = false;



            shuffledIndices = [];



            favorites = [];



            // Zde zajistíme, že window.tracks je skutečně pole před kopírováním



            originalTracks = Array.isArray(window.tracks) ? [...window.tracks] : []; 



            currentPlaylist = [...originalTracks];







            console.log("clearAllAudioPlayerData: Globální proměnné audio přehrávače resetovány.");



            populatePlaylist(currentPlaylist);



            updateVolumeDisplayAndIcon();



            updateButtonActiveStates(false);



            if (currentPlaylist.length > 0 && audioPlayer && audioSource && trackTitleElement) {



                audioSource.src = currentPlaylist[currentTrackIndex].src;



                trackTitleElement.textContent = currentPlaylist[currentTrackIndex].title;



                audioPlayer.load();



            } else if (trackTitleElement) {



                trackTitleElement.textContent = "Playlist je prázdný";



            }



            updateActiveTrackVisuals();







            // Opraveno volání showNotification přidáním argumentu 'info'



            window.showNotification('Všechna data audio přehrávače byla smazána!', 'info', 3000);



            console.log("clearAllAudioPlayerData: Proces mazání všech dat audio přehrávače dokončen.");



        } else {



            console.log("clearAllAudioPlayerData: Mazání všech dat audio přehrávače zrušeno uživatelem (2. fáze).");



        }



    } else {



        console.log("clearAllAudioPlayerData: Mazání všech dat audio přehrávače zrušeno uživatelem (1. fáze).");



    }



};











// --- Ostatní pomocné funkce (zůstávají v hlavním skriptu, minimalizovány) ---







function updateClock() {



    const now = new Date();



    if (clockHours) clockHours.textContent = String(now.getHours()).padStart(2, '0');



    if (clockMinutes) clockMinutes.textContent = String(now.getMinutes()).padStart(2, '0');



    if (clockSeconds) clockSeconds.textContent = String(now.getSeconds()).padStart(2, '0');



    



    const options = { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' };



    if (currentDateElement) currentDateElement.textContent = now.toLocaleDateString('cs-CZ', options);



}



setInterval(updateClock, 1000); 



updateClock();











function logarithmicVolume(value) {



    return Math.pow(parseFloat(value), 3.0); 



}







function updateVolumeDisplayAndIcon() {



    if (!audioPlayer || !volumeSlider || !muteButton || !volumeValueElement) return; 



    const volume = audioPlayer.volume;



    const sliderValue = parseFloat(volumeSlider.value); 







    if (audioPlayer.muted || volume === 0) { 



        muteButton.textContent = '🔇';



        volumeValueElement.textContent = '0';



    } else {



        volumeValueElement.textContent = Math.round(sliderValue * 100);



        if (sliderValue <= 0.01) muteButton.textContent = '🔇'; 



        else if (sliderValue <= 0.2) muteButton.textContent = '🔈';



        else if (sliderValue <= 0.5) muteButton.textContent = '🔉'; 



        else if (sliderValue <= 0.8) muteButton.textContent = '🔊'; 



        else muteButton.textContent = '🔊'; 



    }



}











function formatTime(seconds) {



    const h = Math.floor(seconds / 3600);



    const m = Math.floor((seconds % 3600) / 60);



    const s = Math.floor(seconds % 60);



    return {



        hours: String(h).padStart(2, '0'),



        minutes: String(m).padStart(2, '0'),



        seconds: String(s).padStart(2, '0')



    };



}







function updateTrackTimeDisplay() {



    if (!audioPlayer || !progressBar || !currentTimeDisplay || !durationDisplayElement) return;



    const currentTime = audioPlayer.currentTime;



    const duration = audioPlayer.duration || 0;



    const formattedCurrent = formatTime(currentTime);



    const formattedDuration = formatTime(duration);







    currentTimeDisplay[0].textContent = formattedCurrent.hours;



    currentTimeDisplay[1].textContent = formattedCurrent.minutes;



    currentTimeDisplay[2].textContent = formattedCurrent.seconds;







    durationDisplayElement[0].textContent = formattedDuration.hours;



    durationDisplayElement[1].textContent = formattedDuration.minutes;



    durationDisplayElement[2].textContent = formattedDuration.seconds;







    if (!isNaN(duration) && duration > 0) {



        progressBar.value = (currentTime / duration) * 100;



    } else {



        progressBar.value = 0;



    }



}







function populatePlaylist(listToDisplay) {



    console.log("populatePlaylist: Naplňuji playlist vizuálně.");



    if (!playlistElement) {



        console.warn("populatePlaylist: Element playlistu nenalezen.");



        return;



    }



    // **ZDE JE KLÍČOVÁ ÚPRAVA PRO PLYNULÉ ZOBRAZENÍ**



    // Přidáme třídu 'hidden', aby se playlist skryl před naplněním



    if (!playlistElement.classList.contains('hidden')) {



        playlistElement.classList.add('hidden');



    }



    



    playlistElement.innerHTML = ''; 



    if (!listToDisplay || listToDisplay.length === 0) {



        playlistElement.innerHTML = '<div class="playlist-item" style="justify-content: center; cursor: default;">Žádné skladby v playlistu</div>';



        console.log("populatePlaylist: Playlist je prázdný, zobrazeno výchozí zpráva.");



    } else {



        listToDisplay.forEach((track) => { 



            const item = document.createElement('div');



            item.className = 'playlist-item';



            item.dataset.originalSrc = track.src; 



            



            // Najdeme originální index skladby pro správné přehrávání a porovnání



            // Používáme originalTracks, které odkazuje na aktuální window.tracks



            const originalIndex = originalTracks.findIndex(ot => ot.title === track.title && ot.src === track.src); 







            if (originalIndex === currentTrackIndex && audioPlayer && !audioPlayer.paused) { 



                item.classList.add('active');



            }



            



            const titleSpan = document.createElement('span');



            titleSpan.textContent = track.title;



            item.appendChild(titleSpan);



            



            const favButton = document.createElement('button');



            favButton.className = 'favorite-button';



            favButton.title = 'Přidat/Odebrat z oblíbených';



            favButton.textContent = favorites.includes(track.title) ? '⭐' : '☆';



            favButton.onclick = async (e) => { 



                e.stopPropagation();



                console.log(`populatePlaylist: Favorite button clicked for "${track.title}".`);



                await toggleFavorite(track.title); 



            };



            item.appendChild(favButton);







            item.addEventListener('click', () => {



                console.log(`populatePlaylist: Playlist item clicked for "${track.title}".`);



                if (originalIndex !== -1) {



                    playTrack(originalIndex); 



                } else {



                    console.warn("populatePlaylist: Skladba nebyla nalezena v originálním seznamu:", track.title);



                }



            });



            playlistElement.appendChild(item);



        });



    }



    console.log("populatePlaylist: Playlist vizuálně naplněn.");



    updateActiveTrackVisuals();







    // **ZDE JE KLÍČOVÁ ÚPRAVA PRO PLYNULÉ ZOBRAZENÍ**



    // Po krátké prodlevě (aby se vykreslil DOM) odebereme třídu 'hidden'



    setTimeout(() => {



        playlistElement.classList.remove('hidden');



        if (playlistElement.style.display === 'none') {



            playlistElement.style.display = 'block'; 



        }



        console.log("populatePlaylist: Playlist zviditelněn po naplnění.");



    }, 50); 



}











function playTrack(originalIndex) {



    console.log(`playTrack: Pokus o přehrání skladby s originálním indexem: ${originalIndex}`);



    if (!originalTracks || originalIndex < 0 || originalIndex >= originalTracks.length) { // Přidána kontrola originalTracks



        console.error("playTrack: Neplatný index skladby nebo prázdný originalTracks.", originalIndex);



        return;



    }



    currentTrackIndex = originalIndex; 



    const track = originalTracks[currentTrackIndex]; 







    if (!audioSource || !trackTitleElement || !audioPlayer) {



        console.error("playTrack: Chybí HTML elementy přehrávače.");



        return;



    }







    audioSource.src = track.src;



    trackTitleElement.textContent = track.title;



    audioPlayer.load();



    audioPlayer.play().then(async () => { 



        console.log("playTrack: Přehrávání:", track.title);



        updateButtonActiveStates(true);



        updateActiveTrackVisuals();



        await saveAudioData(); 



    }).catch(error => {



        console.error('playTrack: Chyba při přehrávání:', error);



        window.showNotification(`Chyba při přehrávání: ${track.title}. Možná špatná URL nebo formát.`, 'error'); // Vylepšená notifikace



        updateButtonActiveStates(false);



    });



}







function updateActiveTrackVisuals() {



    console.log("updateActiveTrackVisuals: Aktualizuji vizuální zvýraznění aktivní skladby.");



    if (!playlistElement || !originalTracks || originalTracks.length === 0) return; // Přidána kontrola



    const items = playlistElement.getElementsByClassName('playlist-item');



    const currentTrackData = originalTracks[currentTrackIndex]; 







    Array.from(items).forEach(item => {



        if (item.dataset.originalSrc && currentTrackData && item.dataset.originalSrc === currentTrackData.src) { 



            item.classList.add('active');



            if (playlistElement.style.display !== 'none' && playlistElement.offsetParent !== null) {



               setTimeout(() => item.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' }), 100);



            }



        } else {



            item.classList.remove('active');



        }



    });



    console.log("updateActiveTrackVisuals: Vizuální zvýraznění aktualizováno.");



}











function playNextTrack() {



    console.log("playNextTrack: Přehrávám další skladbu.");



    if (!originalTracks || originalTracks.length === 0) { // Přidána kontrola



        console.warn("playNextTrack: Nelze přehrát další skladbu, playlist je prázdný.");



        window.showNotification("Nelze přehrát další skladbu, playlist je prázdný.", 'warn');



        return;



    }







    let nextIndex;



    if (isShuffled) {



        if (shuffledIndices.length === 0) generateShuffledIndices();



        nextIndex = shuffledIndices.pop(); 



        if (typeof nextIndex === 'undefined') { 



            generateShuffledIndices();



            nextIndex = shuffledIndices.pop();



        }



    } else {



        nextIndex = (currentTrackIndex + 1) % originalTracks.length;



    }



    playTrack(nextIndex);



}







function playPrevTrack() {



    console.log("playPrevTrack: Přehrávám předchozí skladbu.");



    if (!originalTracks || originalTracks.length === 0) { // Přidána kontrola



        console.warn("playPrevTrack: Nelze přehrát předchozí skladbu, playlist je prázdný.");



        window.showNotification("Nelze přehrát předchozí skladbu, playlist je prázdný.", 'warn');



        return;



    }







    let prevIndex;



    if (isShuffled) { 



        if (shuffledIndices.length === 0) generateShuffledIndices();



        prevIndex = shuffledIndices.pop();



        if (typeof prevIndex === 'undefined') {



            generateShuffledIndices();



            prevIndex = shuffledIndices.pop();



        }



    } else {



        prevIndex = (currentTrackIndex - 1 + originalTracks.length) % originalTracks.length;



    }



    playTrack(prevIndex);



}







function generateShuffledIndices() {



    if (!originalTracks || originalTracks.length === 0) { // Přidána kontrola



        console.warn("generateShuffledIndices: Nelze generovat, playlist je prázdný.");



        shuffledIndices = [];



        return;



    }



    shuffledIndices = Array.from({ length: originalTracks.length }, (_, i) => i)



                            .filter(i => i !== currentTrackIndex); 



    for (let i = shuffledIndices.length - 1; i > 0; i--) {



        const j = Math.floor(Math.random() * (i + 1));



        [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];



    }



    console.log("generateShuffledIndices: Nové náhodné pořadí generováno:", shuffledIndices);



}







function updateButtonActiveStates(isPlaying) {



    console.log(`updateButtonActiveStates: Aktualizuji stav tlačítek přehrávání (isPlaying: ${isPlaying}).`);



    if (playButton) playButton.classList.toggle('active', isPlaying);



    if (pauseButton) pauseButton.classList.toggle('active', !isPlaying);



}







window.toggleFavorite = async function(trackTitle) { 



    console.log(`toggleFavorite: Přepínám oblíbenost pro: ${trackTitle}`);



    const indexInFavorites = favorites.indexOf(trackTitle);



    if (indexInFavorites === -1) {



        favorites.push(trackTitle);



        console.log(`toggleFavorite: Skladba "${trackTitle}" přidána do oblíbených.`);



    } else {



        favorites.splice(indexInFavorites, 1);



        console.log(`toggleFavorite: Skladba "${trackTitle}" odebrána z oblíbených.`);



    }



    await saveAudioData(); 



    



    populatePlaylist(currentPlaylist); 



    updateFavoritesMenu(); 



    console.log("toggleFavorite: Oblíbené aktualizovány a uloženy.");



};







// --- Event Listeners ---



if (playButton) playButton.addEventListener('click', () => {



    console.log("Play button clicked.");



    if (audioPlayer && audioSource.src && audioSource.src !== window.location.href) { // Kontrola audioSource.src



        audioPlayer.play().then(() => updateButtonActiveStates(true)).catch(e => console.error("Play error:", e));



    } else if (originalTracks.length > 0) { 



        playTrack(currentTrackIndex); 



    } else {



        window.showNotification("Nelze přehrát, playlist je prázdný.", 'warn');



        console.warn("Play button: Nelze přehrát, playlist je prázdný.");



    }



});



if (pauseButton) pauseButton.addEventListener('click', () => {



    console.log("Pause button clicked.");



    if (audioPlayer) audioPlayer.pause();



    updateButtonActiveStates(false);



});



if (prevButton) prevButton.addEventListener('click', () => {



    console.log("Previous button clicked.");



    playPrevTrack();



});



if (nextButton) nextButton.addEventListener('click', () => {



    console.log("Next button clicked.");



    playNextTrack();



});







if (loopButton) loopButton.addEventListener('click', async () => { 



    console.log("Loop button clicked.");



    if (audioPlayer) audioPlayer.loop = !audioPlayer.loop;



    loopButton.classList.toggle('active', audioPlayer.loop);



    loopButton.title = audioPlayer.loop ? "Opakování zapnuto" : "Opakování vypnuto";



    await saveAudioData(); 



    console.log("Loop state saved:", audioPlayer.loop);



});







if (shuffleButton) shuffleButton.addEventListener('click', async () => { 



    console.log("Shuffle button clicked.");



    isShuffled = !isShuffled;



    shuffleButton.classList.toggle('active', isShuffled);



    shuffleButton.title = isShuffled ? "Náhodné přehrávání zapnuto" : "Náhodné přehrávání vypnuto";



    if (isShuffled) {



        generateShuffledIndices();



    }



    await saveAudioData(); 



    console.log("Shuffle state saved:", isShuffled);



});







if (resetButton) resetButton.addEventListener('click', async () => { 



    console.log("Reset button clicked.");



    if (audioPlayer) {



        audioPlayer.currentTime = 0;



        if (!audioPlayer.paused) {



          audioPlayer.play().catch(e => console.error("Play error on reset:", e));



        }



    }



    await saveAudioData(); 



});











if (fullscreenToggleButton) fullscreenToggleButton.addEventListener('click', () => {



    console.log("Fullscreen toggle button clicked.");



    if (!document.fullscreenElement) {



        document.documentElement.requestFullscreen().catch(err => console.error("Fullscreen error:", err));



    } else {



        if (document.exitFullscreen) document.exitFullscreen();



    }



});



document.addEventListener('fullscreenchange', () => {



    console.log("Fullscreen state changed.");



    if (fullscreenToggleButton) {



        fullscreenToggleButton.classList.toggle('active', !!document.fullscreenElement);



        fullscreenToggleButton.title = document.fullscreenElement ? "Ukončit celou obrazovku (F)" : "Celá obrazovka (F)";



    }



    adjustPlaylistHeight(!!document.fullscreenElement); 



});







if (toggleInfoButton && popiskyElement) toggleInfoButton.addEventListener('click', () => {



    console.log("Toggle info button clicked.");



    popiskyElement.style.display = (popiskyElement.style.display === 'none' || popiskyElement.style.display === '') ? 'block' : 'none';



});



if (reloadButton) reloadButton.addEventListener('click', () => {



    console.log("Reload button clicked. Reloading page.");



    window.location.reload();



});







let playlistVisible = true; 



if (togglePlaylistButton && playlistElement) togglePlaylistButton.addEventListener('click', () => {



    console.log("Toggle playlist button clicked.");



    playlistVisible = !playlistVisible;



    playlistElement.style.display = playlistVisible ? 'block' : 'none';



    togglePlaylistButton.classList.toggle('active', playlistVisible);



    togglePlaylistButton.title = playlistVisible ? "Skrýt playlist" : "Zobrazit playlist";



    if (playlistVisible) {



        updateActiveTrackVisuals(); 



    }



});







if (progressBar && audioPlayer) progressBar.addEventListener('input', () => {



    // console.log("Progress bar changed."); 



    if (audioPlayer.duration) {



        audioPlayer.currentTime = audioPlayer.duration * (progressBar.value / 100);



    }



});







if (volumeSlider && audioPlayer) volumeSlider.addEventListener('input', async (e) => { 



    // console.log("Volume slider changed."); 



    audioPlayer.volume = logarithmicVolume(e.target.value);



    updateVolumeDisplayAndIcon();



    await saveAudioData(); 



});



if (muteButton && audioPlayer && volumeSlider) muteButton.addEventListener('click', async () => { 



    console.log("Mute button clicked.");



    audioPlayer.muted = !audioPlayer.muted; 



    if (audioPlayer.muted) {



        muteButton.dataset.previousVolume = volumeSlider.value; 



        volumeSlider.value = 0; 



    } else {



        const prevSliderVol = muteButton.dataset.previousVolume || '0.1'; 



        volumeSlider.value = prevSliderVol;



        audioPlayer.volume = logarithmicVolume(prevSliderVol);



    }



    updateVolumeDisplayAndIcon();



    await saveAudioData(); 



});







if (audioPlayer) {



    audioPlayer.addEventListener('volumechange', updateVolumeDisplayAndIcon);



    audioPlayer.addEventListener('timeupdate', updateTrackTimeDisplay);



    audioPlayer.addEventListener('loadedmetadata', updateTrackTimeDisplay);



    audioPlayer.addEventListener('ended', async () => { 



        console.log("Audio ended. Playing next track if not looping.");



        updateButtonActiveStates(false);



        if (!audioPlayer.loop) playNextTrack(); 



        await saveAudioData(); 



        console.log("Player state saved after track ended.");



    });



    audioPlayer.addEventListener('play', () => updateButtonActiveStates(true));



    audioPlayer.addEventListener('pause', () => updateButtonActiveStates(false));



    audioPlayer.addEventListener('error', (e) => { // Vylepšená chyba



        console.error("Audio player error:", e); 



        window.showNotification("Chyba přehrávače: " + e.message, 'error');



    });



}











document.addEventListener('keydown', async (e) => { 



    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;



    console.log(`Key pressed: ${e.code}`);



    let preventDefault = true;



    switch (e.code) {



        case 'Space': case 'KeyP': 



            if (audioPlayer) {



                if (audioPlayer.paused) playButton?.click(); 



                else pauseButton?.click(); 



            }



            break;



        case 'ArrowLeft': prevButton?.click(); break;



        case 'ArrowRight': nextButton?.click(); break;



        case 'KeyM': muteButton?.click(); break;



        case 'KeyL': loopButton?.click(); break;



        case 'KeyS': if (audioPlayer) { audioPlayer.pause(); audioPlayer.currentTime = 0; updateButtonActiveStates(false); await saveAudioData(); } break; 



        case 'KeyR': resetButton?.click(); break;



        case 'KeyF': fullscreenToggleButton?.click(); break;



        case 'KeyA': 



            if (volumeSlider) { 



                volumeSlider.value = Math.max(0, parseFloat(volumeSlider.value) - 0.05); 



                volumeSlider.dispatchEvent(new Event('input')); 



                await saveAudioData(); 



            } 



            break; 



        case 'KeyD': 



            if (volumeSlider) { 



                volumeSlider.value = Math.min(1, parseFloat(volumeSlider.value) + 0.05); 



                volumeSlider.dispatchEvent(new Event('input')); 



                await saveAudioData(); 



            } 



            break; 



        case 'KeyB': favoritesButton?.click(); break;



        case 'KeyT': timerButton?.click(); break;



        case 'ArrowUp': if (playlistElement) playlistElement.scrollTop -= 50; break;



        case 'ArrowDown': if (playlistElement) playlistElement.scrollTop += 50; break;



        default: preventDefault = false; 



    }



    if (preventDefault) e.preventDefault();



});







// --- Časovač ---



const timerButton = document.getElementById('timer-button');



const timerContainer = document.getElementById('timer-container');



const timerMinutesDisplay = document.getElementById('timer-minutes');



const timerSecondsDisplay = document.getElementById('timer-seconds');



const timerStartButton = document.getElementById('timer-start');



const timerStopButton = document.getElementById('timer-stop');



const timerButtonsPreset = {



    'timer-5': 5, 'timer-15': 15, 'timer-30': 30, 'timer-60': 60



};



let timerInterval = null;



let timerValueInSeconds = 15 * 60; 



let isTimerRunning = false;







function updateTimerDisplay() {



    if (!timerMinutesDisplay || !timerSecondsDisplay) return;



    const minutes = Math.floor(timerValueInSeconds / 60);



    const seconds = timerValueInSeconds % 60;



    timerMinutesDisplay.textContent = String(minutes).padStart(2, '0');



    timerSecondsDisplay.textContent = String(seconds).padStart(2, '0');



}







function countdown() {



    if (timerValueInSeconds > 0) {



        timerValueInSeconds--;



        updateTimerDisplay();



    } else {



        clearInterval(timerInterval);



        isTimerRunning = false;



        if (timerButton) timerButton.classList.remove('active');



        if (audioPlayer) audioPlayer.pause();



        updateButtonActiveStates(false);



        const alertSound = new Audio('https://www.trekcore.com/audio/computer/tng_computer_start_beep.mp3');



        alertSound.play().catch(e => console.error('Chyba přehrání zvuku časovače:', e));



        window.showNotification('🖖 Časovač vypršel! Přehrávání bylo zastaveno.', 'info', 5000); // Změna alert na notifikaci



    }



}



function setTimerValue(minutes) {



    timerValueInSeconds = minutes * 60;



    updateTimerDisplay();



}







if (timerButton && timerContainer) timerButton.addEventListener('click', () => {



    console.log("Timer button clicked.");



    timerContainer.style.display = (timerContainer.style.display === 'none' || !timerContainer.style.display) ? 'flex' : 'none';



    timerButton.classList.toggle('active', timerContainer.style.display === 'flex');



});



if (timerStartButton) timerStartButton.addEventListener('click', () => {



    console.log("Timer start button clicked.");



    if (!isTimerRunning && timerValueInSeconds > 0) {



        clearInterval(timerInterval); 



        timerInterval = setInterval(countdown, 1000);



        isTimerRunning = true;



        if (timerButton) timerButton.classList.add('active'); 



    } else if (isTimerRunning) {



        window.showNotification("Časovač již běží.", 'warn');



    } else if (timerValueInSeconds === 0) {



        window.showNotification("Časovač je na nule, nastavte novou hodnotu.", 'warn');



    }



});



if (timerStopButton) timerStopButton.addEventListener('click', () => {



    console.log("Timer stop button clicked.");



    clearInterval(timerInterval);



    isTimerRunning = false;



    window.showNotification("Časovač zastaven.", 'info'); // Přidána notifikace



});



Object.entries(timerButtonsPreset).forEach(([id, minutes]) => {



    const btn = document.getElementById(id);



    if (btn) btn.addEventListener('click', () => {



        console.log(`Timer preset button clicked: ${minutes} minutes.`);



        setTimerValue(minutes);



        if (!isTimerRunning) { // Pokud časovač neběží, nabídni start



            window.showNotification(`Časovač nastaven na ${minutes} minut. Klikněte na Start!`, 'info');



        }



    });



});



updateTimerDisplay(); 











// --- Menu Oblíbených ---



// Vytvoření tlačítka a menu pro oblíbené



favoritesButton.id = 'favorites-button';



favoritesButton.className = 'control-button'; 



favoritesButton.title = 'Oblíbené skladby (B)';



favoritesButton.textContent = '⭐';



const controlsDiv = document.querySelector('#control-panel .controls');



if (controlsDiv) {



    controlsDiv.appendChild(favoritesButton); 



    console.log("Favorites button added to DOM.");



} else {



    console.error("Element .controls nebyl nalezen pro přidání tlačítka oblíbených.");



}











const favoritesMenu = document.createElement('div');



favoritesMenu.className = 'favorites-menu';



favoritesMenu.innerHTML = '<h3>Oblíbené skladby</h3><div id="favorites-list" class="playlist"></div>'; 



document.body.appendChild(favoritesMenu); 



console.log("Favorites menu added to DOM.");







function updateFavoritesMenu() {



    console.log("updateFavoritesMenu: Aktualizuji menu oblíbených.");



    const favoritesList = favoritesMenu.querySelector('#favorites-list');



    if (!favoritesList) {



        console.warn("updateFavoritesMenu: Element seznamu oblíbených nenalezen.");



        return;



    }



    favoritesList.innerHTML = '';



    if (favorites.length === 0) {



        favoritesList.innerHTML = '<div class="playlist-item" style="justify-content: center; cursor: default;">Žádné oblíbené skladby</div>';



        console.log("updateFavoritesMenu: Seznam oblíbených je prázdný.");



        return;



    }



    favorites.forEach(title => {



        const originalTrack = originalTracks.find(t => t.title === title);



        if (!originalTrack) {



            console.warn(`updateFavoritesMenu: Skladba "${title}" nenalezena v originálním seznamu, přeskočena.`);



            return; 



        }







        const item = document.createElement('div');



        item.className = 'playlist-item'; 



        item.dataset.originalSrc = originalTrack.src;







        if (currentTrackIndex === originalTracks.indexOf(originalTrack) && audioPlayer && !audioPlayer.paused) {



            item.classList.add('active');



        }



        



        const titleSpan = document.createElement('span');



        titleSpan.textContent = title;



        item.appendChild(titleSpan);







        const removeBtn = document.createElement('button');



        removeBtn.className = 'favorite-remove favorite-button'; 



        removeBtn.title = 'Odebrat z oblíbených';



        removeBtn.textContent = '🗑️';



        removeBtn.onclick = async (e) => { 



            e.stopPropagation();



            console.log(`updateFavoritesMenu: Remove button clicked for "${title}".`);



            await toggleFavorite(title); 



        };



        item.appendChild(removeBtn);







        item.addEventListener('click', () => {



            console.log(`updateFavoritesMenu: Playlist item clicked for "${title}".`);



            const trackToPlayIndex = originalTracks.indexOf(originalTrack);



            if (trackToPlayIndex !== -1) playTrack(trackToPlayIndex);



            favoritesMenu.style.display = 'none'; 



            if (favoritesButton) favoritesButton.classList.remove('active');



        });



        favoritesList.appendChild(item);



    });



    console.log("updateFavoritesMenu: Menu oblíbených aktualizováno.");



}







if (favoritesButton) favoritesButton.addEventListener('click', async (e) => { 



    console.log("Favorites button clicked.");



    e.stopPropagation(); 



    if (favoritesMenu.style.display === 'none' || !favoritesMenu.style.display) {



        await updateFavoritesMenu(); 



        favoritesMenu.style.display = 'block';



        favoritesButton.classList.add('active');



        console.log("Favorites menu opened.");



    } else {



        favoritesMenu.style.display = 'none';



        favoritesButton.classList.remove('active');



        console.log("Favorites menu closed.");



    }



});



document.addEventListener('click', (e) => {



    if (favoritesMenu && !favoritesMenu.contains(e.target) && e.target !== favoritesButton) {



        favoritesMenu.style.display = 'none';



        if (favoritesButton) favoritesButton.classList.remove('active');



        console.log("Favorites menu closed by outside click.");



    }



});











// --- Inicializace ---



document.addEventListener('DOMContentLoaded', async () => { 



    console.log("DOMContentLoaded: DOM plně načten. Spouštím inicializaci audio přehrávače.");







    const firebaseInitialized = await window.initializeFirebaseAppAudio(); 



    if (!firebaseInitialized) {



        console.error("DOMContentLoaded: Kritická chyba: Nepodařilo se inicializovat Firebase pro audio přehrávač. Data z cloudu nebudou dostupná.");



        window.showNotification("Kritická chyba: Nelze se připojit k databázi. Data se ukládají pouze lokálně!", 'error');



    } else {



        console.log("DOMContentLoaded: Firebase inicializace dokončena pro audio přehrávač.");



    }







    await loadAudioData(); 







    console.log("DOMContentLoaded: Inicializace prvků UI přehrávače.");



    if (playlistElement) {



        playlistElement.classList.add('hidden'); 



    }







    if (playlistElement) populatePlaylist(currentPlaylist); 



    updateVolumeDisplayAndIcon(); 



    updateButtonActiveStates(false); 







    if (currentPlaylist.length > 0 && audioPlayer && audioSource && trackTitleElement) {



        const firstTrack = currentPlaylist[currentTrackIndex]; 



        audioSource.src = firstTrack.src;



        trackTitleElement.textContent = firstTrack.title;



        audioPlayer.load(); 



    } else if (trackTitleElement) {



        trackTitleElement.textContent = "Playlist je prázdný";



    }



    updateActiveTrackVisuals(); 



    



    if (typeof restorePreviousSettings === 'function') restorePreviousSettings();



    if (typeof restorePreviousBackground === 'function') restorePreviousBackground();







    setInterval(updateClock, 1000);



    updateClock();







    console.log("DOMContentLoaded: Hlavní inicializace audio přehrávače dokončena.");







    setTimeout(() => {



        if (playlistElement) {



            playlistElement.classList.remove('hidden');



            if (playlistElement.style.display === 'none') {



                playlistElement.style.display = 'block'; 



            }



        }



        console.log("DOMContentLoaded: Playlist zviditelněn po naplnění.");



    }, 100); 



});







// --- Poznámky k původnímu kódu (není třeba měnit, jen pro kontext) ---



function detectDeviceType() {



    const screenWidth = window.screen.width;



    const screenHeight = window.screen.height;



    const userAgent = navigator.userAgent.toLowerCase();



    const deviceInfo = {



        isInfinixNote30: ((screenWidth <= 420 && screenHeight >= 800) && (userAgent.includes('infinix') || userAgent.includes('note30') || userAgent.includes('android'))),



        isLargeMonitor: screenWidth > 1600,



        isMobile: screenWidth <= 768,



        orientation: window.matchMedia("(orientation: landscape)").matches ? 'landscape' : 'portrait'



    };



    localStorage.setItem('device_isLargeMonitor', deviceInfo.isLargeMonitor.toString());



    localStorage.setItem('device_isInfinixNote30', deviceInfo.isInfinixNote30.toString());



    localStorage.setItem('device_isMobile', deviceInfo.isMobile.toString());



    localStorage.setItem('device_orientation', deviceInfo.orientation);



    return deviceInfo;



}







function adjustPlaylistHeight(isFullscreen = false) {



    const playlist = document.querySelector('#playlist');



    if (!playlist) return;



    const deviceInfo = detectDeviceType();



    localStorage.setItem('playlist_isFullscreen', isFullscreen.toString());



    let newHeight = '245px'; 



    if (deviceInfo.isInfinixNote30) {



        newHeight = deviceInfo.orientation === 'landscape' ? '240px' : '240px';



    } else if (isFullscreen) {



        newHeight = deviceInfo.isLargeMonitor ? '427px' : '360px';



    } else {



        newHeight = deviceInfo.isLargeMonitor ? '360px' : '245px';



    }



    playlist.style.maxHeight = newHeight;



    localStorage.setItem('playlist_lastHeight', newHeight);



}







function restorePreviousSettings() {



    const playlist = document.querySelector('#playlist');



    if (!playlist) return;



    const lastHeight = localStorage.getItem('playlist_lastHeight');



    if (lastHeight) {



        playlist.style.maxHeight = lastHeight;



    } else {



        adjustPlaylistHeight(localStorage.getItem('playlist_isFullscreen') === 'true');



    }



}







function setBackgroundForDevice() {



    const deviceInfo = detectDeviceType();



    const backgrounds = {



        desktop: 'https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/image_1920x1080_2.jpg?ver=0',



        infinix: 'https://img41.rajce.idnes.cz/d4102/19/19244/19244630_db82ad174937335b1a151341387b7af2/images/image_1024x1792.jpg?ver=0'



    };



    let backgroundUrl = deviceInfo.isInfinixNote30 ? backgrounds.infinix : backgrounds.desktop;



    const bgContainer = document.querySelector('.background-image-container img');



    if (bgContainer) bgContainer.src = backgroundUrl; 



    localStorage.setItem('background_url', backgroundUrl);



}







function restorePreviousBackground() {



    const savedBackgroundUrl = localStorage.getItem('background_url');



    const bgContainerImg = document.querySelector('.background-image-container img');



    if (!bgContainerImg) return;







    if (savedBackgroundUrl) {



        bgContainerImg.src = savedBackgroundUrl;



    } else {



        setBackgroundForDevice();



    }



}







window.addEventListener('orientationchange', () => setTimeout(() => {



    adjustPlaylistHeight(!!document.fullscreenElement);



    setBackgroundForDevice();



}, 300));







window.addEventListener('resize', () => {



    if (window.resizeTimer) clearTimeout(window.resizeTimer);



    window.resizeTimer = setTimeout(() => {



        adjustPlaylistHeight(!!document.fullscreenElement);



        setBackgroundForDevice();



    }, 250);



});







function initStorageSystem() {



    console.log("initStorageSystem: Systém ukládání (localStorage) pro playlist by byl inicializován zde, ale data jsou nyní řízena přes Firebase/LocalStorage.");



}

        

  // *** ZDE ZAČÍNÁ KÓD PRO SKRYTÍ ZPRÁVY "Probíhá synchronizace dat..." ***



    // Původní: const loadingMessageElement = document.querySelector('.loading-message');

    // Změna: Teď získáme referenci na CELÝ KONTEJNER

    const errorImagePlaceholder = document.querySelector('.error-image-placeholder');



    if (errorImagePlaceholder) { // Kontrolujeme, zda existuje rodičovský kontejner

        console.log("Skrývám CELÝ KONTEJNER 'error-image-placeholder' za 4 sekundy.");

        setTimeout(() => {

            errorImagePlaceholder.style.display = 'none'; // Skryje celý div

            // Můžeš zkusit i plynulejší efekt:

            // errorImagePlaceholder.style.opacity = '0'; // Zprůhlední ho

            // setTimeout(() => { errorImagePlaceholder.style.display = 'none'; }, 500); // Pak ho úplně skryje po animaci opacity



        }, 6000); // 4000 milisekund = 4 sekundy

    } else {

        console.warn("Element s třídou '.error-image-placeholder' pro skrytí nebyl nalezen.");

    }



    // *** KONEC KÓDU PRO SKRYTÍ ZPRÁVY ***



// ... zbytek tvého kódu uvnitř DOMContentLoaded ...
