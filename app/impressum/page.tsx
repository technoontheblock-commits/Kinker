import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Impressum | KINKER',
  description: 'Impressum und rechtliche Informationen der KNKR GmbH',
}

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-black pt-32 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-12">IMPRESSUM</h1>
        
        <div className="space-y-10 text-white/80">
          {/* Company Info */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">KNKR GmbH</h2>
            <p className="space-y-1">
              Barcelona-Strasse 4<br />
              4142 Münchenstein<br />
              Schweiz
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">E-Mail</h2>
            <a 
              href="mailto:info@knkr.ch" 
              className="text-red-500 hover:text-red-400 transition-colors"
            >
              info@knkr.ch
            </a>
          </section>

          {/* Authorized Representatives */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Vertretungsberechtigte Person(en)</h2>
            <ul className="space-y-1">
              <li>Franco Zucale</li>
              <li>Nicolas Summermatter</li>
            </ul>
          </section>

          {/* Commercial Register */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Handelsregister-Eintrag</h2>
            <div className="space-y-2">
              <p><span className="text-white/60">Eingetragener Firmenname:</span> KNKR GmbH</p>
              <p><span className="text-white/60">Unternehmens-Nr (UID):</span> CHE-491.863.600</p>
            </div>
          </section>

          {/* VAT Number */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Mehrwertsteuer-Nummer</h2>
            <p>CHE-491.863.600 MWST</p>
          </section>

          {/* Liability Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Haftungsausschluss</h2>
            <p className="leading-relaxed">
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, Genauigkeit, 
              Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
            </p>
            <p className="leading-relaxed mt-4">
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, 
              welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten Informationen, 
              durch Missbrauch der Verbindung oder durch technische Störungen entstanden sind, werden ausgeschlossen.
            </p>
            <p className="leading-relaxed mt-4">
              Alle Angebote sind unverbindlich. Der Autor behält es sich ausdrücklich vor, Teile der Seiten 
              oder das gesamte Angebot ohne besondere Ankündigung zu verändern, zu ergänzen, zu löschen 
              oder die Veröffentlichung zeitweise oder endgültig einzustellen.
            </p>
          </section>

          {/* Links Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Haftungsausschluss für Links</h2>
            <p className="leading-relaxed">
              Verweise und Links auf Webseiten Dritter liegen ausserhalb unseres Verantwortungsbereichs. 
              Es wird jegliche Verantwortung für solche Webseiten abgelehnt. Der Zugriff und die Nutzung 
              solcher Webseiten erfolgen auf eigene Gefahr des jeweiligen Nutzers.
            </p>
          </section>

          {/* Copyright */}
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">Urheberrechte</h2>
            <p className="leading-relaxed">
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf dieser Website, 
              gehören ausschliesslich der Firma KNKR GmbH oder den speziell genannten Rechteinhabern. 
              Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung des Urheberrechtsträgers im Voraus einzuholen.
            </p>
          </section>

          {/* Source */}
          <section className="pt-8 border-t border-white/10">
            <p className="text-white/40 text-sm">Quelle: SwissAnwalt</p>
          </section>
        </div>
      </div>
    </div>
  )
}
