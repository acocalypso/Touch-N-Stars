<template>
  <div class="landing-page">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-white mb-4">🔭 Telescopius Plugin</h1>
      <p class="text-xl text-gray-300 mb-6">
        Bringe deine Zielobjekte von Telescopius.com direkt in Touch'N'Stars
      </p>
    </div>

    <!-- Info Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div class="info-card">
        <div class="card-icon">🎯</div>
        <h3 class="text-xl font-bold text-white mb-3">Was ist das Plugin?</h3>
        <p class="text-gray-300 text-sm mb-4">
          Lade deine gespeicherten Zielobjekte von Telescopius.com direkt in Touch'N'Stars und nutze
          sie für Navigation und Framing.
        </p>
        <ul class="text-gray-400 text-sm space-y-1">
          <li>• Lade Ziellisten von Telescopius.com</li>
          <li>• Navigiere direkt zu Objekten</li>
          <li>• Nutze Framing-Assistent</li>
          <li>• Offline-Cache für schnellen Zugriff</li>
        </ul>
      </div>

      <div class="info-card">
        <div class="card-icon">🌐</div>
        <h3 class="text-xl font-bold text-white mb-3">Was ist Telescopius?</h3>
        <p class="text-gray-300 text-sm mb-4">
          Telescopius ist eine umfassende Astronomie-Plattform für die Entdeckung und Planung von
          Himmelsbeobachtungen.
        </p>
        <ul class="text-gray-400 text-sm space-y-1 mb-4">
          <li>• Umfangreiche Objektdatenbank</li>
          <li>• Personalisierte Ziellisten</li>
          <li>• Beobachtungsplanung</li>
          <li>• Community und Sharing</li>
        </ul>
        <a href="https://telescopius.com" target="_blank" class="btn-link">
          Telescopius.com besuchen →
        </a>
      </div>

      <div class="info-card">
        <div class="card-icon">⚡</div>
        <h3 class="text-xl font-bold text-white mb-3">Hauptfunktionen</h3>
        <p class="text-gray-300 text-sm mb-4">
          Nahtlose Integration zwischen Telescopius und Touch'N'Stars:
        </p>
        <ul class="text-gray-400 text-sm space-y-1">
          <li>• <strong>Automatischer Import:</strong> Alle Ziellisten auf einmal</li>
          <li>• <strong>Intelligenter Cache:</strong> Schneller Offline-Zugriff</li>
          <li>• <strong>Direkte Navigation:</strong> Slew mit einem Klick</li>
          <li>• <strong>Framing Integration:</strong> Nutzt bestehende Tools</li>
          <li>• <strong>Standortbasiert:</strong> Berücksichtigt deinen Standort</li>
        </ul>
      </div>
    </div>

    <!-- API Setup Section -->
    <div class="api-setup-section">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-white mb-2">🔑 API-Schlüssel einrichten</h2>
        <p class="text-gray-300">
          Folge diesen einfachen Schritten, um das Plugin zu konfigurieren:
        </p>
      </div>

      <div class="setup-steps">
        <div class="setup-step">
          <div class="step-number">1</div>
          <div class="step-content">
            <h4 class="text-white font-semibold mb-2">Telescopius Account erstellen</h4>
            <p class="text-gray-300 text-sm mb-3">
              Falls du noch keinen Account hast, registriere dich kostenlos:
            </p>
            <a href="https://telescopius.com/register" target="_blank" class="btn-external">
              Kostenlos registrieren
            </a>
          </div>
        </div>

        <div class="setup-step">
          <div class="step-number">2</div>
          <div class="step-content">
            <h4 class="text-white font-semibold mb-2">API-Schlüssel anfordern</h4>
            <p class="text-gray-300 text-sm mb-3">
              Melde dich an und gehe zur API-Seite für deinen persönlichen Schlüssel:
            </p>
            <a href="https://telescopius.com/api" target="_blank" class="btn-external">
              API-Schlüssel anfordern
            </a>
          </div>
        </div>

        <div class="setup-step">
          <div class="step-number">3</div>
          <div class="step-content">
            <h4 class="text-white font-semibold mb-2">API-Schlüssel eingeben</h4>
            <p class="text-gray-300 text-sm mb-3">
              Klicke unten auf "API Key konfigurieren" und gib deinen Schlüssel ein:
            </p>
            <button
              @click="$emit('openApiKeyModal')"
              class="default-button-blue flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                ></path>
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                ></path>
              </svg>
              API Key konfigurieren
            </button>
          </div>
        </div>
      </div>

      <div class="security-note">
        <div class="flex items-start gap-3">
          <div class="text-yellow-400 mt-1">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fill-rule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clip-rule="evenodd"
              />
            </svg>
          </div>
          <div>
            <p class="text-yellow-400 font-semibold text-sm">Sicherheit</p>
            <p class="text-gray-300 text-sm">
              Dein API-Schlüssel wird nur lokal auf deinem Gerät gespeichert und nie an andere
              weitergegeben. Du kannst ihn jederzeit wieder löschen.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['openApiKeyModal']);
</script>

<style scoped>
/* Landing Page Styles */
.landing-page {
  max-width: 100%;
}

.info-card {
  @apply bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-6 border border-gray-700 shadow-lg;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-icon {
  @apply w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-2xl mb-4;
}

.btn-link {
  @apply text-blue-400 hover:text-blue-300 text-sm font-medium underline transition-colors;
}

.btn-external {
  @apply inline-block px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors;
}

.api-setup-section {
  @apply bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-8 border border-gray-700 shadow-lg;
}

.setup-steps {
  @apply space-y-6 mb-6;
}

.setup-step {
  @apply flex items-start gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-600;
}

.step-number {
  @apply bg-gradient-to-br from-blue-500 to-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0;
}

.step-content {
  @apply flex-1;
}

.security-note {
  @apply bg-yellow-900/20 border border-yellow-600 rounded-lg p-4;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .setup-step {
    @apply flex-col text-center;
  }

  .step-number {
    @apply mx-auto mb-3;
  }

  .info-card {
    @apply p-4;
  }

  .card-icon {
    @apply w-10 h-10 text-xl;
  }
}
</style>
