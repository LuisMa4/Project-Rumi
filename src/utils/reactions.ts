import { Heart, House, MapPinCheck, Sparkles, Star, ThumbsUp, type LucideIcon } from 'lucide-react'
import type { PostType, ReactionTipo } from '../types'

export interface ReactionDef {
  tipo: ReactionTipo
  label: string
  icon: LucideIcon
}

/** Reacciones de cada tipo de publicación, en el orden en que se muestran. */
export const REACTIONS_BY_POST_TYPE: Record<PostType, ReactionDef[]> = {
  'busco-roomie': [{ tipo: 'recomendar', label: 'Recomendar', icon: ThumbsUp }],
  'ofrezco-cuarto': [
    { tipo: 'buen-lugar', label: 'Buen lugar', icon: House },
    { tipo: 'lo-conozco', label: 'Lo conozco', icon: MapPinCheck },
    { tipo: 'recomendado', label: 'Recomendado', icon: ThumbsUp },
  ],
  lugar: [
    { tipo: 'like', label: 'Like', icon: Heart },
    { tipo: 'me-encanta', label: 'Me encanta', icon: Sparkles },
    { tipo: 'recomendar', label: 'Recomendar', icon: ThumbsUp },
  ],
  viaje: [
    { tipo: 'me-interesa', label: 'Me interesa', icon: Star },
    { tipo: 'recomendado', label: 'Recomendado', icon: ThumbsUp },
  ],
}
