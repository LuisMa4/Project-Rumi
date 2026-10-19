import { AtSign, CalendarDays, MapPin, Wallet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Alert } from '../components/Alert'
import { Avatar } from '../components/Avatar'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { NotFound } from '../components/NotFound'
import { PostCard } from '../components/PostCard'
import { ProfileForm } from '../components/ProfileForm'
import { useAuth } from '../context/useAuth'
import { useStartChat } from '../hooks/useStartChat'
import { listByAuthor } from '../services/postsService'
import { resetDemo } from '../services/seed'
import { getById } from '../services/usersService'
import type { PostWithAuthor, PublicUser } from '../types'
import { formatDateRange, formatPrice } from '../utils/format'
import styles from './ProfilePage.module.css'

type Loaded =
  | { key: string; status: 'notfound' }
  | { key: string; status: 'ok'; profile: PublicUser; posts: PostWithAuthor[] }

export function ProfilePage() {
  const { id } = useParams()
  const { user, refreshUser, logout, loginDemo } = useAuth()
  const navigate = useNavigate()
  const { startChat, error: chatError } = useStartChat()
  const [editing, setEditing] = useState(false)
  const [version, setVersion] = useState(0)
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  const profileId = id ?? user?.id ?? ''
  const key = `${profileId}:${version}`

  useEffect(() => {
    if (!profileId) return
    let cancelled = false
    Promise.all([getById(profileId), listByAuthor(profileId)])
      .then(([profile, posts]) => {
        if (!cancelled) setLoaded({ key, status: 'ok', profile, posts })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key, status: 'notfound' })
      })
    return () => {
      cancelled = true
    }
  }, [profileId, key])

  if (!user) return null
  if (id === user.id) return <Navigate to="/perfil" replace />
  // Mientras se recarga tras guardar, seguimos mostrando lo anterior.
  if (!loaded || !loaded.key.startsWith(`${profileId}:`)) return <p className={styles.muted}>Cargando…</p>
  if (loaded.status === 'notfound') return <NotFound />

  const { profile, posts } = loaded
  const propio = profile.id === user.id

  async function onSaved() {
    setEditing(false)
    setVersion((v) => v + 1)
    await refreshUser()
  }

  async function onReset() {
    if (!window.confirm('Se borrarán los cambios y se cargarán los datos de ejemplo. ¿Continuar?')) return
    await resetDemo()
    await loginDemo()
    navigate('/', { replace: true })
  }

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <div className={styles.cover} aria-hidden="true" />
        <div className={styles.identity}>
          <span className={styles.avatar}>
            <Avatar id={profile.id} nombre={profile.nombre} size={88} />
          </span>
          <h1 className={styles.name}>{profile.nombre}</h1>
          <p className={styles.muted}>{profile.universidad}</p>
        </div>

        {editing ? (
          <ProfileForm user={profile} onSaved={onSaved} onCancel={() => setEditing(false)} />
        ) : (
          <div className={styles.details}>
            <ul className={styles.facts}>
              <li>
                <MapPin size={16} aria-hidden="true" />
                {profile.paisOrigen} → {profile.ciudadDestino}, {profile.paisDestino}
              </li>
              <li>
                <CalendarDays size={16} aria-hidden="true" />
                {formatDateRange(profile.fechaLlegada, profile.fechaSalida)}
              </li>
              {profile.presupuesto !== undefined && (
                <li>
                  <Wallet size={16} aria-hidden="true" />
                  Presupuesto de {formatPrice(profile.presupuesto, profile.moneda)} al mes
                </li>
              )}
              {profile.instagram && (
                <li>
                  <AtSign size={16} aria-hidden="true" />
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noreferrer">
                    @{profile.instagram}
                  </a>
                </li>
              )}
            </ul>

            {profile.bio ? (
              <p className={styles.bio}>{profile.bio}</p>
            ) : (
              propio && <p className={styles.muted}>Cuéntale a otros estudiantes cómo eres como roomie.</p>
            )}

            {profile.intereses.length > 0 && (
              <ul className={styles.tags} aria-label="Intereses">
                {profile.intereses.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
            )}

            {chatError && <Alert>{chatError}</Alert>}

            <div className={styles.actions}>
              {propio ? (
                <>
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    Editar perfil
                  </Button>
                  <Button variant="ghost" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <Button onClick={() => startChat(profile.id)}>Enviar mensaje</Button>
              )}
            </div>
          </div>
        )}
      </section>

      <section className={styles.posts}>
        <h2>{propio ? 'Tus publicaciones' : 'Publicaciones'}</h2>
        {posts.length === 0 ? (
          <EmptyState
            title={propio ? 'Todavía no publicaste nada' : 'Sin publicaciones por ahora'}
            text={propio ? 'Cuenta qué estás buscando desde el inicio.' : undefined}
          />
        ) : (
          posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} showActions={false} />)
        )}
      </section>

      {propio && (
        <section className={styles.reset}>
          <div>
            <h2>Datos de demo</h2>
            <p className={styles.muted}>Borra los cambios y vuelve a cargar los estudiantes y publicaciones de ejemplo.</p>
          </div>
          <Button variant="secondary" onClick={onReset}>
            Restablecer datos de demo
          </Button>
        </section>
      )}
    </div>
  )
}
