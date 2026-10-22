import type { PostType } from '../types'

/** Descripción y ejemplo de cada tipo, para guiar a quien publica. */
export const TYPE_INFO: Record<PostType, { descripcion: string; placeholder: string }> = {
  'busco-roomie': {
    descripcion:
      'Cuenta a quién buscas para compartir piso: cuándo llegas, por qué zona y cómo eres como roomie.',
    placeholder: 'Llego a Madrid en febrero y busco con quién compartir piso cerca de la universidad…',
  },
  'ofrezco-cuarto': {
    descripcion: 'Publica un cuarto o piso disponible: cómo es, cuánto cuesta y desde cuándo está libre.',
    placeholder: 'Habitación exterior en piso compartido, a 10 minutos de la universidad…',
  },
  lugar: {
    descripcion:
      'Recomienda un sitio que valga la pena: un restaurante, una zona bonita para pasear, un café para estudiar…',
    placeholder: 'Buenísimo para comer barato y conocer gente los fines de semana…',
  },
  viaje: {
    descripcion: 'Propón un viaje o una escapada y encuentra con quién ir.',
    placeholder: 'Escapada a Sintra el fin de semana; busco 2 o 3 personas para compartir gastos…',
  },
}

export const POST_TYPES: PostType[] = ['busco-roomie', 'ofrezco-cuarto', 'lugar', 'viaje']
