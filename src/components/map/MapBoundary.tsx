import { Component, type ReactNode } from 'react'
import styles from './Map.module.css'

/** Si el mapa no carga (sin internet, por ejemplo), muestra un aviso en vez de romper la página. */
export class MapBoundary extends Component<{ children: ReactNode; height: number }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className={styles.placeholder} style={{ height: this.props.height }}>
          No pudimos cargar el mapa
        </div>
      )
    }
    return this.props.children
  }
}
