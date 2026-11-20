import type { ComponentType } from 'react'
import AR from 'country-flag-icons/react/3x2/AR'
import AT from 'country-flag-icons/react/3x2/AT'
import AU from 'country-flag-icons/react/3x2/AU'
import BE from 'country-flag-icons/react/3x2/BE'
import BO from 'country-flag-icons/react/3x2/BO'
import BR from 'country-flag-icons/react/3x2/BR'
import CA from 'country-flag-icons/react/3x2/CA'
import CH from 'country-flag-icons/react/3x2/CH'
import CL from 'country-flag-icons/react/3x2/CL'
import CN from 'country-flag-icons/react/3x2/CN'
import CO from 'country-flag-icons/react/3x2/CO'
import CR from 'country-flag-icons/react/3x2/CR'
import CU from 'country-flag-icons/react/3x2/CU'
import CZ from 'country-flag-icons/react/3x2/CZ'
import DE from 'country-flag-icons/react/3x2/DE'
import DK from 'country-flag-icons/react/3x2/DK'
import DO from 'country-flag-icons/react/3x2/DO'
import EC from 'country-flag-icons/react/3x2/EC'
import ES from 'country-flag-icons/react/3x2/ES'
import FI from 'country-flag-icons/react/3x2/FI'
import FR from 'country-flag-icons/react/3x2/FR'
import GB from 'country-flag-icons/react/3x2/GB'
import GR from 'country-flag-icons/react/3x2/GR'
import GT from 'country-flag-icons/react/3x2/GT'
import HN from 'country-flag-icons/react/3x2/HN'
import IE from 'country-flag-icons/react/3x2/IE'
import IT from 'country-flag-icons/react/3x2/IT'
import JP from 'country-flag-icons/react/3x2/JP'
import KR from 'country-flag-icons/react/3x2/KR'
import MX from 'country-flag-icons/react/3x2/MX'
import NI from 'country-flag-icons/react/3x2/NI'
import NL from 'country-flag-icons/react/3x2/NL'
import NO from 'country-flag-icons/react/3x2/NO'
import PA from 'country-flag-icons/react/3x2/PA'
import PE from 'country-flag-icons/react/3x2/PE'
import PL from 'country-flag-icons/react/3x2/PL'
import PR from 'country-flag-icons/react/3x2/PR'
import PT from 'country-flag-icons/react/3x2/PT'
import PY from 'country-flag-icons/react/3x2/PY'
import SE from 'country-flag-icons/react/3x2/SE'
import SV from 'country-flag-icons/react/3x2/SV'
import US from 'country-flag-icons/react/3x2/US'
import UY from 'country-flag-icons/react/3x2/UY'
import VE from 'country-flag-icons/react/3x2/VE'
import { countryCode } from '../utils/countries'
import styles from './Flag.module.css'

// Solo las banderas de COUNTRIES, cada una desde su archivo: el índice del paquete
// carga las ~250 banderas (240 KB más en el build y pruebas mucho más lentas).
const FLAGS: Record<string, ComponentType> = { AR, AT, AU, BE, BO, BR, CA, CH, CL, CN, CO, CR, CU, CZ, DE, DK, DO, EC, ES, FI, FR, GB, GR, GT, HN, IE, IT, JP, KR, MX, NI, NL, NO, PA, PE, PL, PR, PT, PY, SE, SV, US, UY, VE }

/**
 * Bandera del país como SVG (Windows no dibuja los emojis de bandera).
 * Si el país no es conocido, no dibuja nada.
 */
export function Flag({ pais }: { pais: string }) {
  const code = countryCode(pais)
  const Svg = code ? FLAGS[code] : undefined
  if (!Svg) return null
  return (
    <span className={styles.flag} data-pais={code} aria-hidden="true">
      <Svg />
    </span>
  )
}
