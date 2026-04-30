import { useEffect } from 'react'

// Désactive les raccourcis quand l'utilisateur est en train de saisir du texte
// ou que la cible est un select / un élément contenteditable.
function isTypingTarget(target) {
  if (!target) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

// Raccourcis globaux du MVP :
//  ←/→            : jour précédent / suivant (dans la semaine courante)
//  Shift + ←/→    : semaine précédente / suivante
//  N              : nouveau créneau
//  T              : revenir à aujourd'hui
//  Échap          : déjà géré localement par les modales
//
// `disabled` permet de couper tous les raccourcis pendant qu'une modale est
// ouverte (la modale gère elle-même Escape et son propre clavier).
export default function useKeyboardShortcuts({
  disabled,
  onPrevDay,
  onNextDay,
  onPrevWeek,
  onNextWeek,
  onCreate,
  onToday,
}) {
  useEffect(() => {
    if (disabled) return undefined
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (isTypingTarget(e.target)) return

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault()
          if (e.shiftKey) onPrevWeek?.()
          else onPrevDay?.()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (e.shiftKey) onNextWeek?.()
          else onNextDay?.()
          break
        case 'n':
        case 'N':
          if (e.shiftKey) return // laisse passer Shift+N
          e.preventDefault()
          onCreate?.()
          break
        case 't':
        case 'T':
          if (e.shiftKey) return
          e.preventDefault()
          onToday?.()
          break
        default:
          break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [
    disabled,
    onPrevDay,
    onNextDay,
    onPrevWeek,
    onNextWeek,
    onCreate,
    onToday,
  ])
}
