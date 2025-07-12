// --- Univerzální Performance Monitor ---
// Jednoduše přidejte tento kód na začátek jakéhokoli scriptu

(function() {
    'use strict';
    
    // Globální proměnné pro monitoring
    let startTime = performance.now();
    let memoryStart = performance.memory ? performance.memory.usedJSHeapSize : 0;
    let frameCount = 0;
    let lastFrameTime = startTime;
    
    // Minimalistická konfigurace
    const config = {
        logInterval: 5000,    // Výpis každých 5 sekund
        enabled: false,       // Vypnuto při startu
        prefix: '⚡'          // Prefix pro logy
    };
    
    // Detekce výkonu stránky
    function getPagePerformance() {
        const now = performance.now();
        const memoryNow = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        return {
            runtime: Math.round(now - startTime),
            memory: Math.round((memoryNow - memoryStart) / 1024 / 1024 * 100) / 100,
            fps: Math.round(frameCount / ((now - startTime) / 1000))
        };
    }
    
    // Minimalistický výpis
    function logPerformance() {
        if (!config.enabled) return;
        
        const perf = getPagePerformance();
        const status = perf.memory > 50 ? '🔴' : perf.memory > 20 ? '🟡' : '🟢';
        
        console.log(`${config.prefix} ${status} ${perf.runtime}ms | ${perf.memory}MB | ${perf.fps}fps`);
    }
    
    // Frame counter pro FPS
    function countFrame() {
        frameCount++;
        requestAnimationFrame(countFrame);
    }
    
    // Inicializace existujícího tlačítka z HTML
    function initializeButton() {
        // Hledáme tlačítko v HTML podle ID nebo class
        const button = document.getElementById('perf-monitor-btn') || 
                      document.querySelector('.perf-monitor-btn') ||
                      document.querySelector('[data-perf-monitor]');
        
        if (!button) {
            console.warn('⚠️ Tlačítko pro monitoring nenalezeno. Použijte ID "perf-monitor-btn" nebo class "perf-monitor-btn"');
            return;
        }
        
        // Aktualizace textu tlačítka
        function updateButtonText() {
            const originalText = button.dataset.originalText || button.textContent;
            button.dataset.originalText = originalText;
            
            if (config.enabled) {
                button.textContent = '⏹️';
                button.style.background = '#e74c3c';
                button.style.color = 'white';
            } else {
                button.textContent = originalText.includes('Monitor') ? originalText : '📊';
                button.style.background = '';
                button.style.color = '';
            }
        }
        
        // Click handler
        button.onclick = (e) => {
            e.preventDefault();
            config.enabled = !config.enabled;
            updateButtonText();
            
            if (config.enabled) {
                console.log(`${config.prefix} ▶️`);
                startMonitoring();
            } else {
                console.log(`${config.prefix} ⏹️`);
                stopMonitoring();
            }
        };
        
        // Inicializace vzhledu
        updateButtonText();
        
        // Uložíme referenci pro programové ovládání (až po vytvoření perfMon)
        if (window.perfMon) {
            window.perfMon.button = button;
        }
    }
    
    // Proměnné pro stop/start
    let monitoringInterval;
    let isFrameCounterRunning = false;
    
    // Spustí monitoring
    function startMonitoring() {
        if (!isFrameCounterRunning) {
            requestAnimationFrame(countFrame);
            isFrameCounterRunning = true;
        }
        
        monitoringInterval = setInterval(logPerformance, config.logInterval);
    }
    
    // Zastaví monitoring
    function stopMonitoring() {
        clearInterval(monitoringInterval);
        isFrameCounterRunning = false;
    }
    
    // Inicializace
    // Použije existující tlačítko z HTML
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initButtonAfterSetup);
    } else {
        initButtonAfterSetup();
    }
    
    // Výpis při zavření stránky (pokud je zapnut)
    window.addEventListener('beforeunload', function() {
        if (config.enabled) {
            console.log(`${config.prefix} 📊 Finální stats:`, getPagePerformance());
        }
    }, { passive: true });
    
    // Globální API pro ruční kontrolu
    window.perfMon = {
        log: logPerformance,
        get: getPagePerformance,
        toggle: () => {
            config.enabled = !config.enabled;
            if (config.enabled) {
                startMonitoring();
            } else {
                stopMonitoring();
            }
        },
        config: config,
        button: null  // Bude nastaveno při inicializaci tlačítka
    };
    
    // Inicializace tlačítka po vytvoření perfMon
    function initButtonAfterSetup() {
        initializeButton();
        // Teď už můžeme bezpečně nastavit referenci
        const button = document.getElementById('perf-monitor-btn') || 
                      document.querySelector('.perf-monitor-btn') ||
                      document.querySelector('[data-perf-monitor]');
        if (button) {
            window.perfMon.button = button;
        }
    }
    
})();

// --- Jak použít vlastní tlačítko v HTML ---

// Možnost 1: Použít ID
// <button id="perf-monitor-btn">Monitor výkonu</button>

// Možnost 2: Použít CSS class
// <button class="perf-monitor-btn">Sledovat výkon</button>

// Možnost 3: Použít data atribut
// <button data-perf-monitor>🔍 Performance</button>

// Možnost 4: Jakýkoli z těchto prvků
// <a href="#" class="perf-monitor-btn">Monitor</a>
// <div id="perf-monitor-btn" role="button">📊 Stats</div>
// <span data-perf-monitor style="cursor: pointer;">⚡ Test</span>

// Tlačítko může být umístěno kdekoliv v HTML struktuře!

// Manuální volání:
  perfMon.log()       // - okamžitý výpis
  perfMon.get()        //- vrátí data jako objekt
  perfMon.toggle()     //- zapne/vypne monitoring
  perfMon.config.logInterval = 5000  //- změní interval

// --- Ukázkový výstup v konzoli ---
// ⚡ 🟢 1250ms | 2.3MB | 60fps
// ⚡ 🟡 6780ms | 25.1MB | 45fps
// ⚡ 🔴 12340ms | 67.8MB | 30fps

// --- Rozšířená verze s více detaily (volitelná) ---
 
function advancedLog() {
    const perf = performance.getEntriesByType('navigation')[0];
    const paint = performance.getEntriesByType('paint');
    
    console.group('🔍 Detailní výkon');
    console.log('DOM:', Math.round(perf.domContentLoadedEventEnd - perf.domContentLoadedEventStart) + 'ms');
    console.log('Load:', Math.round(perf.loadEventEnd - perf.loadEventStart) + 'ms');
    if (paint.length > 0) {
        console.log('Paint:', Math.round(paint[0].startTime) + 'ms');
    }
    console.groupEnd();
}

// Přidat do window.perfMon
window.perfMon.advanced = advancedLog;
 
