import type { ReactNode } from 'react'
import { Logo } from './Logo'
import styles from './AuthShell.module.css'

const DESTINOS = ['Madrid', 'Lisboa', 'Buenos Aires', 'Ciudad de México', 'Barcelona', 'Montreal']

/** Marco de login y registro: panel celeste de bienvenida + tarjeta con el formulario. */
export function AuthShell({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className={styles.page}>
      <section className={styles.welcome}>
        <Logo size="lg" dot="blanco" />
        <p className={styles.tagline}>Encuentra roomie para tu intercambio</p>
        <p className={styles.lead}>
          Conecta con estudiantes que viajan a tu misma ciudad, compara alquileres y llega con todo listo.
        </p>
        <ul className={styles.destinos} aria-label="Destinos con estudiantes en Rumi">
          {DESTINOS.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      </section>
      <main className={styles.panel}>
        <div className={styles.card}>
          <h1 className={styles.title}>{title}</h1>
          {children}
          <p className={styles.footer}>{footer}</p>
        </div>
      </main>
    </div>
  )
}
