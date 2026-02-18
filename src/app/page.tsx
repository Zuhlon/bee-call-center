'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// Client types
const CLIENT_TYPES = [
  { name: '🌻 полянка', emoji: '🌸' },
  { name: '🌳 лес', emoji: '🦌' },
  { name: '🏡 улей', emoji: '🏠' },
  { name: '🌺 сад', emoji: '🌷' },
  { name: '🌻 луг', emoji: '🌼' },
]

// Toxic spider call (rare)
const SPIDER_CLIENT = { name: '🕸️ паук-хулиган', emoji: '🕷️', isToxic: true }

// Bonus types
const BONUS_TYPES = [
  { id: 'honey', emoji: '🍯', name: 'Мёд', effect: 'balance', value: 2 },
  { id: 'bee', emoji: '🐝', name: 'Пчела', effect: 'operator', value: 1 },
  { id: 'shield', emoji: '🛡️', name: 'Щит', effect: 'shield', value: 1 },
  { id: 'speed', emoji: '⚡', name: 'Скорость', effect: 'speed', value: 5 },
]

interface Client {
  id: number
  type: typeof CLIENT_TYPES[0] | typeof SPIDER_CLIENT
  timeLeft: number
  isToxic?: boolean
}

interface Bonus {
  id: number
  type: typeof BONUS_TYPES[0]
  x: number
  y: number
}

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
}

interface Particle {
  id: number
  x: number
  y: number
  emoji: string
  vx: number
  vy: number
}

export default function BeeCallCenter() {
  // Game state
  const [balance, setBalance] = useState(15)
  const [operators, setOperators] = useState(3)
  const [maxOperators] = useState(12)
  const [clientQueue, setClientQueue] = useState<Client[]>([])
  const [hornetActive, setHornetActive] = useState(false)
  const [hornetDuration, setHornetDuration] = useState(0)
  const [lastCaptured, setLastCaptured] = useState(0)
  
  // Dynamic systems
  const [combo, setCombo] = useState(0)
  const [comboTimer, setComboTimer] = useState(0)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)
  const [xpToNext, setXpToNext] = useState(10)
  const [highScore, setHighScore] = useState(0)
  const [gameSpeed, setGameSpeed] = useState(1)
  
  // Bonuses
  const [activeBonuses, setActiveBonuses] = useState<Bonus[]>([])
  const [hasShield, setHasShield] = useState(false)
  const [shieldTimer, setShieldTimer] = useState(0)
  
  // Effects
  const [particles, setParticles] = useState<Particle[]>([])
  
  // Busy operators
  const [busyOperators, setBusyOperators] = useState<Set<number>>(new Set())
  
  // Stats
  const [totalCreditsEarned, setTotalCreditsEarned] = useState(0)
  const [totalCallsAnswered, setTotalCallsAnswered] = useState(0)
  
  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    { id: 'first3', name: 'Первые шаги', description: '3 мёда', icon: '🥈', unlocked: false },
    { id: 'first10', name: 'Медовый мастер', description: '10 мёда', icon: '💎', unlocked: false },
    { id: 'combo5', name: 'Комбо-мастер', description: 'Комбо x5', icon: '🔥', unlocked: false },
    { id: 'level5', name: 'Профи', description: 'Уровень 5', icon: '⭐', unlocked: false },
  ])
  
  // UI state
  const [balanceAnimation, setBalanceAnimation] = useState(false)
  const [hireAnimation, setHireAnimation] = useState(false)
  const [answerAnimation, setAnswerAnimation] = useState(false)
  const [newClientAnimation, setNewClientAnimation] = useState<number | null>(null)
  const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(null)
  const [penaltyAnimation, setPenaltyAnimation] = useState(false)
  const [levelUpEffect, setLevelUpEffect] = useState(false)
  const [spiderVictimBanner, setSpiderVictimBanner] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  
  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(false)
  const [tutorialStep, setTutorialStep] = useState(0)
  
  const clientIdRef = useRef(0)
  const bonusIdRef = useRef(0)
  const particleIdRef = useRef(0)
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null)
  const hornetLoopRef = useRef<NodeJS.Timeout | null>(null)
  const hornetScheduleRef = useRef<NodeJS.Timeout | null>(null)
  const clientTickRef = useRef<NodeJS.Timeout | null>(null)
  const comboLoopRef = useRef<NodeJS.Timeout | null>(null)

  const freeOperators = operators - busyOperators.size

  // Check for game over - no bees and no honey to hire
  useEffect(() => {
    if (operators === 0 && balance < 10 && !showTutorial && !gameOver) {
      // Use timeout to avoid setState in effect body
      const timer = setTimeout(() => setGameOver(true), 0)
      return () => clearTimeout(timer)
    }
  }, [operators, balance, showTutorial, gameOver])

  // Restart game
  const restartGame = () => {
    setBalance(15)
    setOperators(3)
    setClientQueue([])
    setHornetActive(false)
    setHornetDuration(0)
    setLastCaptured(0)
    setCombo(0)
    setComboTimer(0)
    setLevel(1)
    setXp(0)
    setXpToNext(10)
    setGameSpeed(1)
    setActiveBonuses([])
    setHasShield(false)
    setShieldTimer(0)
    setParticles([])
    setBusyOperators(new Set())
    setTotalCreditsEarned(0)
    setTotalCallsAnswered(0)
    setAchievements([
      { id: 'first3', name: 'Первые шаги', description: '3 мёда', icon: '🥈', unlocked: false },
      { id: 'first10', name: 'Медовый мастер', description: '10 мёда', icon: '💎', unlocked: false },
      { id: 'combo5', name: 'Комбо-мастер', description: 'Комбо x5', icon: '🔥', unlocked: false },
      { id: 'level5', name: 'Профи', description: 'Уровень 5', icon: '⭐', unlocked: false },
    ])
    setGameOver(false)
    setLevelUpEffect(false)
    setSpiderVictimBanner(false)
  }

  // Check if first launch - show tutorial
  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('bee-call-center-tutorial')
    if (!hasSeenTutorial) {
      // Use timeout to avoid setState in effect body
      const timer = setTimeout(() => setShowTutorial(true), 0)
      return () => clearTimeout(timer)
    }
  }, [])

  const closeTutorial = () => {
    setShowTutorial(false)
    localStorage.setItem('bee-call-center-tutorial', 'true')
  }

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1)
    } else {
      closeTutorial()
    }
  }

  const TUTORIAL_STEPS = [
    {
      title: '🐝 Добро пожаловать!',
      content: 'Вы управляете пчелиным колл-центром! Пчёлы принимают звонки и зарабатывают мёд.',
      emoji: '🐝',
    },
    {
      title: '📞 Отвечайте на звонки',
      content: 'Нажмите ОТВЕТИТЬ, чтобы пчела приняла звонок. Пчела будет занята 3 секунды. Заработайте +1 мёд за каждый ответ!',
      emoji: '📞',
    },
    {
      title: '🐝 Нанимайте пчёл',
      content: 'Нажмите НАНЯТЬ, чтобы добавить новую пчелу. Стоимость: 10 мёда. Максимум 12 пчёл!',
      emoji: '🐝',
    },
    {
      title: '🔥 Комбо-система',
      content: 'Отвечайте быстро и получайте бонус! Каждое комбо добавляет +10% к заработку!',
      emoji: '🔥',
    },
    {
      title: '🦅 Остерегайтесь шершней!',
      content: 'Шершни атакуют каждые 20-40 секунд и крадут 2-10 пчёл! Щит 🛡️ защитит от атаки.',
      emoji: '🦅',
    },
    {
      title: '🕷️ Пауки-хулиганы',
      content: '9% звонков - от пауков! Ответ отнимет 10 мёда. Избегайте их, если можете!',
      emoji: '🕷️',
    },
    {
      title: '🎁 Собирайте бонусы',
      content: 'Иногда появляются бонусы: 🍯 мёд, 🐝 пчела, 🛡️ щит, ⚡ скорость. Тапните, чтобы забрать!',
      emoji: '🎁',
    },
    {
      title: '💀 Конец игры',
      content: 'Если все пчёлы пропадут и мёда не хватит для найма — игра окончена! Берегите своих пчёл!',
      emoji: '💀',
    },
  ]

  // Spawn particle effect
  const spawnParticles = useCallback((x: number, y: number, emoji: string, count: number) => {
    const newParticles: Particle[] = []
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: ++particleIdRef.current,
        x,
        y,
        emoji,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10 - 3,
      })
    }
    setParticles(prev => [...prev, ...newParticles])
    
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 1000)
  }, [])

  // Add XP and check level up
  const addXp = useCallback((amount: number) => {
    setXp(prev => {
      const newXp = prev + amount
      if (newXp >= xpToNext) {
        setLevel(l => l + 1)
        setXpToNext(n => Math.floor(n * 1.5))
        setLevelUpEffect(true)
        setTimeout(() => {
          setLevelUpEffect(false)
        }, 1500)
        
        // Increase game speed
        setGameSpeed(s => Math.min(s + 0.1, 2))
        
        return newXp - xpToNext
      }
      return newXp
    })
  }, [xpToNext])

  // Check achievements
  const checkAchievements = useCallback(() => {
    setAchievements(prev => {
      const updated = [...prev]
      let newAchievement: Achievement | null = null
      
      if (totalCreditsEarned >= 3 && !updated[0].unlocked) {
        updated[0] = { ...updated[0], unlocked: true }
        newAchievement = updated[0]
      }
      if (totalCreditsEarned >= 10 && !updated[1].unlocked) {
        updated[1] = { ...updated[1], unlocked: true }
        newAchievement = updated[1]
      }
      if (combo >= 5 && !updated[2].unlocked) {
        updated[2] = { ...updated[2], unlocked: true }
        newAchievement = updated[2]
      }
      if (level >= 5 && !updated[3].unlocked) {
        updated[3] = { ...updated[3], unlocked: true }
        newAchievement = updated[3]
      }
      
      if (newAchievement) {
        setAchievementPopup(newAchievement)
        setTimeout(() => setAchievementPopup(null), 3000)
      }
      
      return updated
    })
  }, [totalCreditsEarned, combo, level])

  // Combo system
  useEffect(() => {
    if (combo > 0) {
      comboLoopRef.current = setTimeout(() => {
        setCombo(0)
      }, 3000)
    }
    return () => {
      if (comboLoopRef.current) clearTimeout(comboLoopRef.current)
    }
  }, [combo])

  // Shield timer
  useEffect(() => {
    if (hasShield && shieldTimer > 0) {
      const timer = setInterval(() => {
        setShieldTimer(prev => {
          if (prev <= 1) {
            setHasShield(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [hasShield, shieldTimer])

  // Update high score
  useEffect(() => {
    if (totalCreditsEarned > highScore) {
      const timer = setTimeout(() => setHighScore(totalCreditsEarned), 0)
      return () => clearTimeout(timer)
    }
  }, [totalCreditsEarned, highScore])

  // Global client timer - updates all clients every 100ms
  useEffect(() => {
    clientTickRef.current = setInterval(() => {
      setClientQueue(prev => {
        if (prev.length === 0) return prev
        
        const now = Date.now()
        let hasExpired = false
        let penalty = 0
        
        const updated = prev.map(client => {
          const newTimeLeft = client.timeLeft - 0.1
          if (newTimeLeft <= 0) {
            hasExpired = true
            penalty += 0.1
            return null
          }
          return { ...client, timeLeft: newTimeLeft }
        }).filter(Boolean) as Client[]
        
        if (hasExpired) {
          setBalance(b => Math.max(0, b - penalty))
          setPenaltyAnimation(true)
          setCombo(0)
          setTimeout(() => setPenaltyAnimation(false), 500)
        }
        
        return updated
      })
    }, 100)
    
    return () => {
      if (clientTickRef.current) clearInterval(clientTickRef.current)
    }
  }, [])

  // Spawn client
  const spawnClient = useCallback(() => {
    const newClientId = ++clientIdRef.current
    
    // 9% chance for toxic spider call
    const isToxicCall = Math.random() < 0.09
    
    const newClient: Client = {
      id: newClientId,
      type: isToxicCall ? SPIDER_CLIENT : CLIENT_TYPES[Math.floor(Math.random() * CLIENT_TYPES.length)],
      timeLeft: Math.max(1.5, 3 - (gameSpeed - 1) * 0.3), // 3 seconds at start, min 1.5s
      isToxic: isToxicCall,
    }
    
    setClientQueue(prev => [...prev, newClient])
    setNewClientAnimation(newClientId)
    setTimeout(() => setNewClientAnimation(null), 500)
  }, [gameSpeed])

  // Spawn bonus
  const spawnBonus = useCallback(() => {
    if (activeBonuses.length >= 2) return
    
    const newBonus: Bonus = {
      id: ++bonusIdRef.current,
      type: BONUS_TYPES[Math.floor(Math.random() * BONUS_TYPES.length)],
      x: 20 + Math.random() * 60,
      y: 20 + Math.random() * 50,
    }
    
    setActiveBonuses(prev => [...prev, newBonus])
    
    // Remove after 5 seconds
    setTimeout(() => {
      setActiveBonuses(prev => prev.filter(b => b.id !== newBonus.id))
    }, 5000)
  }, [activeBonuses.length])

  // Collect bonus
  const collectBonus = useCallback((bonus: Bonus) => {
    setActiveBonuses(prev => prev.filter(b => b.id !== bonus.id))
    
    spawnParticles(50, 50, bonus.type.emoji, 8)
    
    switch (bonus.type.effect) {
      case 'balance':
        setBalance(prev => prev + bonus.type.value)
        break
      case 'operator':
        setOperators(prev => Math.min(prev + bonus.type.value, maxOperators))
        break
      case 'shield':
        setHasShield(true)
        setShieldTimer(15)
        break
      case 'speed':
        setGameSpeed(prev => Math.max(0.5, prev - 0.2))
        break
    }
    
    addXp(3)
  }, [spawnParticles, addXp, maxOperators])

  // Hornet attack - steals 2-10 bees, they disappear from hive
  const triggerHornet = useCallback(() => {
    if (hornetActive || operators === 0) return
    
    // Shield blocks the attack
    if (hasShield) {
      setHasShield(false)
      setShieldTimer(0)
      spawnParticles(50, 50, '🛡️', 10)
      return
    }
    
    setHornetActive(true)
    setHornetDuration(8)
    
    // Capture 2-10 operators (they disappear from hive completely)
    const captureAmount = Math.min(operators, Math.floor(Math.random() * 9) + 2) // Random 2-10, capped by available
    setLastCaptured(captureAmount)
    setOperators(prev => Math.max(0, prev - captureAmount))
    
    // Visual feedback
    spawnParticles(50, 50, '🦅', 8)
    spawnParticles(50, 50, '💨', 5)
    
    setTimeout(() => {
      // Hornet alert ends
    }, 500)
    
    // Hornet stays for 8 seconds showing the alert
    hornetLoopRef.current = setInterval(() => {
      setHornetDuration(prev => {
        if (prev <= 1) {
          setHornetActive(false)
          setLastCaptured(0)
          if (hornetLoopRef.current) clearInterval(hornetLoopRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [hornetActive, operators, hasShield, spawnParticles])

  // Game tick - more arcade-like with frequent calls
  useEffect(() => {
    const interval = Math.max(500, 1200 - (gameSpeed - 1) * 250) // Faster spawning for arcade
    
    gameLoopRef.current = setInterval(() => {
      // Spawn clients frequently (85% chance) - arcade feel
      if (Math.random() < 0.85) {
        spawnClient()
      }
      
      // Sometimes spawn extra clients for chaos
      if (Math.random() < 0.4) {
        setTimeout(() => spawnClient(), 200)
      }
      
      // Spawn bonus occasionally
      if (Math.random() < 0.06) {
        spawnBonus()
      }
    }, interval)

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current)
    }
  }, [spawnClient, spawnBonus, gameSpeed])
  
  // Separate hornet scheduler - attacks every 20-40 seconds
  useEffect(() => {
    // Only schedule if not already active and we have operators
    if (hornetActive || operators === 0) return
    
    const nextInterval = (20 + Math.random() * 20) * 1000 // 20-40 seconds
    
    hornetScheduleRef.current = setTimeout(() => {
      triggerHornet()
    }, nextInterval)
    
    return () => {
      if (hornetScheduleRef.current) clearTimeout(hornetScheduleRef.current)
    }
  }, [hornetActive, operators, triggerHornet])

  // Hire bee
  const hireBee = useCallback(() => {
    if (balance >= 10 && operators < maxOperators) {
      setHireAnimation(true)
      setBalance(prev => prev - 10)
      setOperators(prev => Math.min(prev + 1, maxOperators))
      spawnParticles(30, 70, '🐝', 5)
      addXp(1)
      setTimeout(() => setHireAnimation(false), 200)
    }
  }, [balance, operators, maxOperators, spawnParticles, addXp])

  // Process answered call (separated to avoid state update issues)
  const processAnsweredCall = useCallback((client: Client, freeOpIndex: number) => {
    setAnswerAnimation(true)
    
    // Check for toxic spider call
    if (client.isToxic) {
      // Toxic call - lose 10 credits and show banner!
      setBalance(prev => Math.max(0, prev - 10))
      setCombo(0) // Reset combo
      setSpiderVictimBanner(true)
      spawnParticles(50, 50, '🕷️', 15)
      spawnParticles(50, 50, '💀', 10)
      setTimeout(() => {
        setAnswerAnimation(false)
        setSpiderVictimBanner(false)
      }, 2500)
      return
    }
    
    // Combo!
    setCombo(prev => {
      const newCombo = prev + 1
      // Calculate earning with combo bonus
      let earning = 1.0
      if (hornetActive && Math.random() < 0.4) earning = 0.5
      earning *= (1 + newCombo * 0.1) // Combo bonus
      
      setBalance(b => Math.round((b + earning) * 10) / 10)
      setTotalCreditsEarned(total => {
        checkAchievements()
        return total + earning
      })
      
      return newCombo
    })
    setComboTimer(3)
    
    setBusyOperators(prev => new Set([...prev, freeOpIndex]))
    setTimeout(() => {
      setBusyOperators(prev => {
        const next = new Set(prev)
        next.delete(freeOpIndex)
        return next
      })
    }, 3000)
    
    setTotalCallsAnswered(prev => prev + 1)
    
    // Effects
    spawnParticles(70, 50, '🍯', 3)
    
    addXp(2)
    
    setTimeout(() => setAnswerAnimation(false), 200)
  }, [hornetActive, spawnParticles, addXp, checkAchievements])

  // Answer call
  const answerCall = useCallback(() => {
    if (freeOperators <= 0) return
    
    let freeOpIndex = -1
    for (let i = 0; i < operators; i++) {
      if (!busyOperators.has(i)) {
        freeOpIndex = i
        break
      }
    }
    if (freeOpIndex === -1) return
    
    // Use functional update to get the actual first client
    setClientQueue(prev => {
      if (prev.length === 0) return prev
      
      const client = prev[0]
      
      // Process the call outside of state update
      setTimeout(() => processAnsweredCall(client, freeOpIndex), 0)
      
      return prev.slice(1)
    })
  }, [freeOperators, operators, busyOperators, processAnsweredCall])

  return (
    <>
      <style jsx global>{`
        /* Animations */
        @keyframes slideIn {
          0% { transform: translateX(30px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes levelUp {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes bonusFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-8px) rotate(5deg); }
        }
        @keyframes honeyDrip {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(3px); }
        }
        @keyframes beeWiggle {
          0%, 100% { transform: rotate(-3deg); }
          50% { transform: rotate(3deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes glow {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(255, 224, 130, 0.5)); }
          50% { filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 224, 130, 0.8)); }
        }
        @keyframes particleFly {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--vx), var(--vy)) scale(0.5); opacity: 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        @keyframes woodGrain {
          0% { background-position: 0 0; }
          100% { background-position: 100px 100px; }
        }
        
        .slide-in { animation: slideIn 0.25s ease-out; }
        .level-up { animation: levelUp 0.4s ease-in-out; }
        .bonus-float { animation: bonusFloat 2s ease-in-out infinite; cursor: pointer; }
        .honey-drip { animation: honeyDrip 1.5s ease-in-out infinite; }
        .bee-wiggle { animation: beeWiggle 0.3s ease-in-out infinite; }
        .pulse { animation: pulse 1s ease-in-out infinite; }
        .glow { animation: glow 2s ease-in-out infinite; }
        
        /* Hexagonal clip path */
        .hex-cell {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        
        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { 
          background: linear-gradient(180deg, #2D1F14 0%, #3D2914 50%, #2D1F14 100%);
          border-radius: 10px;
          box-shadow: inset 2px 2px 4px rgba(0,0,0,0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(180deg, #FFE082 0%, #F5A623 50%, #D4820F 100%);
          border-radius: 10px;
          box-shadow: inset 1px 1px 2px rgba(255,255,255,0.4), 2px 2px 4px rgba(0,0,0,0.3);
          border: 1px solid #B8860B;
        }
        
        .touch-button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
        }
        
        .safe-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        .safe-top { padding-top: max(12px, env(safe-area-inset-top)); }
        
        .graffiti-text {
          font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }

        /* ═══════════════════════════════════════════════════════════════
           SKEUOMORPHIC BEEHIVE DESIGN SYSTEM
           ═══════════════════════════════════════════════════════════════ */

        /* Realistic Wood Panel */
        .wood-panel {
          background: 
            repeating-linear-gradient(
              90deg,
              transparent 0px,
              rgba(0,0,0,0.03) 1px,
              transparent 2px,
              transparent 20px
            ),
            repeating-linear-gradient(
              0deg,
              transparent 0px,
              rgba(255,255,255,0.02) 1px,
              transparent 2px,
              transparent 30px
            ),
            linear-gradient(180deg, 
              #5D4037 0%, 
              #4E342E 15%,
              #3E2723 30%,
              #4A3728 50%,
              #3D2914 70%,
              #4E342E 85%,
              #3E2723 100%
            );
          box-shadow: 
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            inset 0 -1px 0 rgba(0, 0, 0, 0.3),
            inset 2px 0 4px rgba(0, 0, 0, 0.2),
            inset -2px 0 4px rgba(0, 0, 0, 0.2);
        }

        /* Realistic Wax Panel with texture */
        .wax-panel-real {
          background: 
            repeating-radial-gradient(
              circle at 20% 30%,
              transparent 0px,
              rgba(255,255,255,0.03) 1px,
              transparent 2px,
              transparent 8px
            ),
            repeating-radial-gradient(
              circle at 80% 70%,
              transparent 0px,
              rgba(0,0,0,0.02) 1px,
              transparent 2px,
              transparent 6px
            ),
            linear-gradient(165deg, 
              #FFE082 0%, 
              #E8C872 15%,
              #D4A84B 30%,
              #C49A3D 50%,
              #B8860B 70%,
              #A67B5B 85%,
              #8B6914 100%
            );
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.5),
            inset -2px -2px 4px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.4),
            4px 4px 12px rgba(0, 0, 0, 0.5),
            -2px -2px 8px rgba(255, 213, 79, 0.15);
          border: 3px solid #8B6914;
          border-top-color: #B8860B;
          border-left-color: #A67B5B;
        }

        /* 3D Honeycomb Cell - Free/Bee */
        .honeycomb-free {
          background: 
            radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.4) 0%, transparent 30%),
            radial-gradient(ellipse at 70% 75%, rgba(0,0,0,0.2) 0%, transparent 30%),
            linear-gradient(180deg, 
              #FFE082 0%, 
              #FFD54F 20%,
              #F5A623 40%,
              #E6A800 60%,
              #D4820F 80%,
              #A67B5B 100%
            );
          box-shadow: 
            inset 2px 2px 6px rgba(255, 255, 255, 0.6),
            inset -2px -2px 4px rgba(0, 0, 0, 0.25),
            inset 0 -4px 8px rgba(180, 130, 50, 0.3),
            3px 4px 8px rgba(0, 0, 0, 0.4),
            -1px -1px 3px rgba(255, 224, 130, 0.3);
          border: 2px solid #B8860B;
        }

        /* 3D Honeycomb Cell - Busy */
        .honeycomb-busy {
          background: 
            radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.2) 0%, transparent 30%),
            linear-gradient(180deg, 
              #8D6E63 0%, 
              #6D4C41 30%,
              #5D4037 50%,
              #4E342E 70%,
              #3E2723 100%
            );
          box-shadow: 
            inset 2px 2px 4px rgba(255, 255, 255, 0.15),
            inset -2px -2px 4px rgba(0, 0, 0, 0.4),
            inset 0 2px 6px rgba(0, 0, 0, 0.3),
            3px 4px 6px rgba(0, 0, 0, 0.35);
          border: 2px solid #3E2723;
        }

        /* 3D Honeycomb Cell - Empty/Deep */
        .honeycomb-empty {
          background: 
            radial-gradient(ellipse at 50% 50%, #1A0F08 0%, transparent 70%),
            linear-gradient(180deg, 
              #4A3728 0%, 
              #3D2914 30%,
              #2D1F14 60%,
              #1A0F08 100%
            );
          box-shadow: 
            inset 4px 4px 8px rgba(0, 0, 0, 0.7),
            inset -2px -2px 4px rgba(62, 41, 20, 0.3),
            inset 0 4px 12px rgba(0, 0, 0, 0.5),
            2px 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid #5D4037;
        }

        /* Honey Drop - 3D blob */
        .honey-drop-real {
          background: 
            radial-gradient(ellipse at 35% 30%, rgba(255,255,255,0.7) 0%, transparent 25%),
            radial-gradient(ellipse at 50% 50%, rgba(255,224,130,0.3) 0%, transparent 50%),
            radial-gradient(ellipse at 65% 70%, rgba(0,0,0,0.2) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 40%, #FFE082 0%, #FFD54F 30%, #F5A623 50%, #D4820F 70%, #A67B5B 100%);
          box-shadow: 
            inset 3px 3px 8px rgba(255, 255, 255, 0.6),
            inset -2px -2px 6px rgba(0, 0, 0, 0.2),
            0 6px 12px rgba(0, 0, 0, 0.4),
            0 0 20px rgba(245, 166, 35, 0.4),
            0 0 40px rgba(255, 213, 79, 0.2);
        }

        /* Wax Button - 3D pressed effect */
        .wax-button-real {
          background: 
            linear-gradient(180deg, 
              #FFE082 0%, 
              #FFD54F 10%,
              #F5A623 25%,
              #E6A800 45%,
              #D4820F 65%,
              #F5A623 85%,
              #FFD54F 100%
            );
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.6),
            inset 0 -3px 6px rgba(0, 0, 0, 0.2),
            0 5px 0 #8B6914,
            0 7px 10px rgba(0, 0, 0, 0.4),
            0 1px 0 rgba(255, 255, 255, 0.4);
          border: 3px solid #B8860B;
          border-bottom-color: #8B6914;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5), 0 -1px 0 rgba(0, 0, 0, 0.2);
          transition: all 0.1s ease;
        }
        
        .wax-button-real:active {
          transform: translateY(4px);
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 -1px 2px rgba(255, 255, 255, 0.2),
            0 1px 0 #8B6914,
            0 2px 4px rgba(0, 0, 0, 0.3);
        }

        /* Green Answer Button */
        .answer-button-real {
          background: 
            linear-gradient(180deg, 
              #A5D6A7 0%, 
              #81C784 10%,
              #66BB6A 25%,
              #4CAF50 45%,
              #43A047 65%,
              #388E3C 85%,
              #2E7D32 100%
            );
          box-shadow: 
            inset 0 2px 4px rgba(255, 255, 255, 0.4),
            inset 0 -3px 6px rgba(0, 0, 0, 0.25),
            0 5px 0 #1B5E20,
            0 7px 10px rgba(0, 0, 0, 0.4);
          border: 3px solid #388E3C;
          border-bottom-color: #1B5E20;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3), 0 -1px 0 rgba(0, 0, 0, 0.3);
        }
        
        .answer-button-real:active {
          transform: translateY(4px);
          box-shadow: 
            inset 0 2px 4px rgba(0, 0, 0, 0.3),
            inset 0 -1px 2px rgba(255, 255, 255, 0.15),
            0 1px 0 #1B5E20,
            0 2px 4px rgba(0, 0, 0, 0.3);
        }

        /* Disabled button */
        .button-disabled {
          background: linear-gradient(180deg, #5D4037 0%, #4E342E 50%, #3E2723 100%);
          box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.5);
          border: 2px solid #3E2723;
          opacity: 0.6;
        }

        /* Call Card - Honey Drop Style */
        .call-card-honey {
          background: 
            linear-gradient(180deg, 
              rgba(255,255,255,0.3) 0%, 
              transparent 20%,
              transparent 100%
            ),
            linear-gradient(180deg, 
              #FFE082 0%, 
              #FFD54F 30%,
              #F5A623 60%,
              #D4820F 100%
            );
          box-shadow: 
            inset 1px 1px 3px rgba(255, 255, 255, 0.5),
            inset -1px -1px 2px rgba(0, 0, 0, 0.15),
            3px 4px 8px rgba(0, 0, 0, 0.35),
            0 6px 12px rgba(212, 130, 15, 0.2);
          border: 2px solid #D4820F;
          border-top-color: #E6A800;
        }

        /* Toxic Spider Card */
        .call-card-toxic {
          background: 
            linear-gradient(180deg, 
              rgba(200,130,255,0.3) 0%, 
              transparent 20%,
              transparent 100%
            ),
            linear-gradient(180deg, 
              #CE93D8 0%, 
              #AB47BC 30%,
              #8E24AA 60%,
              #6A1B9A 100%
            );
          box-shadow: 
            inset 1px 1px 3px rgba(200, 130, 255, 0.5),
            inset -1px -1px 2px rgba(0, 0, 0, 0.3),
            3px 4px 8px rgba(0, 0, 0, 0.4),
            0 0 15px rgba(156, 39, 176, 0.4);
          border: 2px solid #7B1FA2;
        }

        /* Inset Panel */
        .inset-panel {
          background: 
            linear-gradient(180deg, 
              #1A0F08 0%, 
              #2D1F14 30%,
              #3D2914 70%,
              #2D1F14 100%
            );
          box-shadow: 
            inset 4px 4px 10px rgba(0, 0, 0, 0.6),
            inset -2px -2px 6px rgba(62, 41, 20, 0.2),
            inset 0 2px 4px rgba(0, 0, 0, 0.4);
          border: 2px solid #5D4037;
          border-top-color: #3E2723;
        }

        /* Badge */
        .badge-honey {
          background: 
            linear-gradient(180deg, 
              #FFE082 0%, 
              #FFD54F 30%,
              #F5A623 70%,
              #D4820F 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.5),
            2px 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid #B8860B;
        }

        .badge-wood {
          background: 
            linear-gradient(180deg, 
              #5D4037 0%, 
              #4E342E 50%,
              #3E2723 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.1),
            2px 2px 4px rgba(0, 0, 0, 0.3);
          border: 2px solid #3E2723;
        }

        /* Progress bar */
        .progress-track {
          background: 
            linear-gradient(180deg, #1A0F08 0%, #2D1F14 50%, #1A0F08 100%);
          box-shadow: 
            inset 2px 2px 4px rgba(0, 0, 0, 0.6),
            inset -1px -1px 2px rgba(62, 41, 20, 0.2);
          border: 1px solid #5D4037;
        }

        .progress-fill-xp {
          background: 
            linear-gradient(180deg, 
              #81C784 0%, 
              #66BB6A 30%,
              #4CAF50 50%,
              #43A047 70%,
              #2E7D32 100%
            );
          box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3);
        }

        /* Alert styles */
        .alert-red {
          background: 
            linear-gradient(180deg, 
              #EF5350 0%, 
              #E53935 30%,
              #D32F2F 50%,
              #C62828 70%,
              #B71C1C 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.2),
            inset -1px -1px 2px rgba(0, 0, 0, 0.2),
            4px 5px 12px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(229, 57, 53, 0.3);
          border: 3px solid #B71C1C;
        }

        .alert-orange {
          background: 
            linear-gradient(180deg, 
              #FFB74D 0%, 
              #FFA726 30%,
              #FB8C00 50%,
              #EF6C00 70%,
              #E65100 100%
            );
          border: 2px solid #EF6C00;
        }

        .alert-green {
          background: 
            linear-gradient(180deg, 
              #81C784 0%, 
              #66BB6A 30%,
              #4CAF50 50%,
              #43A047 70%,
              #2E7D32 100%
            );
          border: 2px solid #1B5E20;
        }

        .alert-blue {
          background: 
            linear-gradient(180deg, 
              #64B5F6 0%, 
              #42A5F5 30%,
              #1E88E5 50%,
              #1565C0 70%,
              #0D47A1 100%
            );
          border: 2px solid #0D47A1;
        }

        /* Combo badge */
        .combo-badge {
          background: 
            linear-gradient(180deg, 
              #FF8A65 0%, 
              #FF7043 30%,
              #F4511E 50%,
              #E64A19 70%,
              #BF360C 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.3),
            2px 3px 6px rgba(0, 0, 0, 0.35);
          border: 2px solid #BF360C;
        }

        /* Achievement unlocked */
        .achievement-unlocked {
          background: 
            linear-gradient(180deg, 
              #FFE082 0%, 
              #FFD54F 30%,
              #F5A623 70%,
              #D4820F 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(255, 255, 255, 0.5),
            2px 2px 4px rgba(0, 0, 0, 0.25);
          border: 2px solid #B8860B;
        }

        .achievement-locked {
          background: 
            linear-gradient(180deg, 
              #5D4037 0%, 
              #4E342E 50%,
              #3E2723 100%
            );
          box-shadow: 
            inset 1px 1px 2px rgba(0, 0, 0, 0.4);
          border: 1px solid #3E2723;
        }
      `}</style>
      
      {/* Main container - Wood texture background */}
      <div className="wood-panel" style={{
        minHeight: '100dvh',
        color: '#FFE082',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
        {/* Honeycomb pattern overlay */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
          opacity: 0.08,
        }}>
          {[...Array(50)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 60,
              height: 70,
              background: `radial-gradient(ellipse at 30% 25%, rgba(255,224,130,0.3) 0%, transparent 40%),
                          linear-gradient(145deg, rgba(245,166,35,0.4) 0%, rgba(212,130,15,0.3) 100%)`,
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              left: `${(i % 7) * 15 - 3}%`,
              top: `${Math.floor(i / 7) * 12 - 3}%`,
              transform: `rotate(${i % 2 === 0 ? 0 : 30}deg)`,
              filter: `blur(${i % 3 === 0 ? 0 : 1}px)`,
            }} />
          ))}
        </div>

        {/* Particles */}
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            fontSize: '24px',
            pointerEvents: 'none',
            animation: 'particleFly 1s ease-out forwards',
            '--vx': `${p.vx * 10}px`,
            '--vy': `${p.vy * 10}px`,
          } as React.CSSProperties}>
            {p.emoji}
          </div>
        ))}
        
        {/* Bonuses to collect */}
        {activeBonuses.map(bonus => (
          <div
            key={bonus.id}
            className="bonus-float honey-drop-real"
            onClick={() => collectBonus(bonus)}
            style={{
              position: 'absolute',
              left: `${bonus.x}%`,
              top: `${bonus.y}%`,
              width: '70px',
              height: '70px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              zIndex: 15,
              cursor: 'pointer',
            }}
          >
            {bonus.type.emoji}
          </div>
        ))}
        
        {/* Level up effect */}
        {levelUpEffect && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '80px', zIndex: 100,
            animation: 'levelUp 0.5s ease-in-out',
            filter: 'drop-shadow(0 4px 12px rgba(255, 224, 130, 0.6))',
          }}>
            ⬆️
          </div>
        )}
        
        {/* Achievement popup */}
        {achievementPopup && (
          <div style={{
            position: 'fixed', bottom: '200px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(180deg, #FFE082 0%, #FFD54F 30%, #F5A623 70%, #D4820F 100%)',
            borderRadius: '20px', padding: '16px 28px',
            display: 'flex', alignItems: 'center', gap: '14px', zIndex: 100,
            boxShadow: 'inset 2px 2px 4px rgba(255, 255, 255, 0.5), inset -2px -2px 4px rgba(0, 0, 0, 0.15), 5px 6px 15px rgba(0, 0, 0, 0.45), 0 0 20px rgba(245, 166, 35, 0.3)',
            border: '3px solid #B8860B',
            animation: 'slideIn 0.5s ease-out',
          }}>
            <span style={{ fontSize: '40px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{achievementPopup.icon}</span>
            <div>
              <div className="graffiti-text" style={{ color: '#3D2914', fontSize: '16px', textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>
                🏆 {achievementPopup.name}
              </div>
              <div style={{ fontSize: '13px', color: '#5D4037', fontWeight: 500 }}>
                {achievementPopup.description}
              </div>
            </div>
          </div>
        )}
        
        {/* Spider victim banner */}
        {spiderVictimBanner && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(180deg, #CE93D8 0%, #AB47BC 30%, #8E24AA 60%, #6A1B9A 100%)',
            borderRadius: '24px', padding: '28px 36px',
            textAlign: 'center', zIndex: 100,
            boxShadow: 'inset 2px 2px 4px rgba(200, 130, 255, 0.4), inset -2px -2px 4px rgba(0, 0, 0, 0.3), 6px 8px 20px rgba(0, 0, 0, 0.5), 0 0 30px rgba(156, 39, 176, 0.4)',
            border: '3px solid #7B1FA2',
            animation: 'slideIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: '72px', marginBottom: '16px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}>🕷️</div>
            <div className="graffiti-text" style={{ color: '#F3E5F5', fontSize: '22px', marginBottom: '10px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              ВЫ СТАЛИ ЖЕРТВОЙ ПАУКА!
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#FFCDD2', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
              -10 мёда
            </div>
          </div>
        )}
        
        {/* Game Over screen */}
        {gameOver && (() => {
          const isLegend = level >= 15
          const isWizard = level >= 5
          
          return (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(26, 15, 8, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="wax-panel-real" style={{
              borderRadius: '28px',
              padding: '40px 32px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
            }}>
              {/* Icon/Character - centered */}
              <div className="inset-panel" style={{ 
                width: '180px', 
                height: '180px', 
                margin: '0 auto 24px auto',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '20px',
              }}>
                <img 
                  src={isLegend ? '/trophy_gold_bg.png' : isWizard ? '/trophy_silver_bg.png' : '/bee_kitty_3d.png'}
                  alt={isLegend ? 'Золотой кубок' : isWizard ? 'Серебряный кубок' : 'Пчела-котик'}
                  style={{ 
                    width: '90%', 
                    height: '90%', 
                    objectFit: 'cover',
                    borderRadius: '16px',
                  }} 
                />
              </div>
              
              {/* Title */}
              <h2 className="graffiti-text" style={{
                fontSize: '24px',
                color: isLegend ? '#FFD700' : isWizard ? '#C0C0C0' : '#FFE082',
                marginBottom: '16px',
                lineHeight: 1.3,
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 1px 0 rgba(255,255,255,0.3)',
              }}>
                {isLegend 
                  ? 'Легендарный уровень!'
                  : isWizard 
                    ? 'Великолепная игра!'
                    : 'Пчёлы дотанцевались до упаду'}
              </h2>
              
              {/* Message */}
              <p style={{
                fontSize: '16px',
                color: '#3D2914',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}>
                {isLegend 
                  ? '🏆 Здесь будет анонс приза!'
                  : isWizard 
                    ? '✨ Ваш уровень — волшебник страны Ос!'
                    : '🐱 Киса и Ося вас поддерживают! Попробуйте ещё раз!'}
              </p>
              
              {/* Stats */}
              <div className="inset-panel" style={{
                borderRadius: '16px',
                padding: '18px',
                marginBottom: '28px',
              }}>
                <div style={{ fontSize: '14px', color: '#D4A84B', marginBottom: '12px', fontWeight: 600 }}>
                  Ваш результат:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
                  <div>
                    <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🍯</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFD54F' }}>{totalCreditsEarned.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>⭐</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFD54F' }}>{level}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📞</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FFD54F' }}>{totalCallsAnswered}</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={restartGame}
                className="touch-button wax-button-real"
                style={{
                  padding: '16px 44px',
                  border: 'none',
                  borderRadius: '18px',
                  color: '#3D2914',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                🔄 Начать заново
              </button>
            </div>
          </div>
          )
        })()}
        
        {/* Tutorial overlay */}
        {showTutorial && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(26, 15, 8, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
            backdropFilter: 'blur(10px)',
          }}>
            <div className="wax-panel-real" style={{
              borderRadius: '28px',
              padding: '36px 30px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
            }}>
              {/* Progress dots */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '28px',
              }}>
                {TUTORIAL_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: '14px', height: '14px',
                    borderRadius: '50%',
                    background: i === tutorialStep 
                      ? 'linear-gradient(180deg, #FFE082, #F5A623)' 
                      : i < tutorialStep 
                        ? 'linear-gradient(180deg, #81C784, #4CAF50)' 
                        : 'linear-gradient(180deg, #5D4037, #3E2723)',
                    boxShadow: i === tutorialStep 
                      ? 'inset 1px 1px 2px rgba(255, 255, 255, 0.5), 0 0 10px rgba(245, 166, 35, 0.5)' 
                      : 'inset 1px 1px 2px rgba(0, 0, 0, 0.4)',
                    border: i === tutorialStep ? '2px solid #B8860B' : '1px solid #3E2723',
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
              
              {/* Emoji */}
              <div style={{
                fontSize: '88px',
                marginBottom: '24px',
                animation: 'float 2s ease-in-out infinite',
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
              }}>
                {TUTORIAL_STEPS[tutorialStep].emoji}
              </div>
              
              {/* Title */}
              <h2 className="graffiti-text" style={{
                fontSize: '24px',
                color: '#3D2914',
                marginBottom: '16px',
                textShadow: '0 1px 0 rgba(255, 255, 255, 0.4)',
              }}>
                {TUTORIAL_STEPS[tutorialStep].title}
              </h2>
              
              {/* Content */}
              <p style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: '#4A3728',
                marginBottom: '32px',
              }}>
                {TUTORIAL_STEPS[tutorialStep].content}
              </p>
              
              {/* Buttons */}
              <div style={{
                display: 'flex', gap: '14px',
                justifyContent: 'center',
              }}>
                <button
                  onClick={closeTutorial}
                  style={{
                    padding: '14px 22px',
                    background: 'linear-gradient(180deg, #5D4037 0%, #4E342E 50%, #3E2723 100%)',
                    border: '2px solid #3E2723',
                    borderRadius: '14px',
                    color: '#D4A84B',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    boxShadow: 'inset 1px 1px 2px rgba(255, 255, 255, 0.1), 2px 3px 6px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  Пропустить
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="touch-button wax-button-real"
                  style={{
                    padding: '14px 32px',
                    border: 'none',
                    borderRadius: '14px',
                    color: '#3D2914',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Начать!' : 'Далее'}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Header */}
        <header className="safe-top" style={{
          padding: '14px 18px',
          position: 'relative', zIndex: 10,
        }}>
          {/* Level & XP bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px',
          }}>
            <div className={levelUpEffect ? 'level-up badge-honey' : 'badge-honey'} style={{
              padding: '8px 16px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px', color: '#3D2914',
            }}>
              ⭐ Уровень {level}
            </div>
            <div className="progress-track" style={{ 
              flex: 1, 
              height: '16px', 
              borderRadius: '10px', 
              overflow: 'hidden',
            }}>
              <div className="progress-fill-xp" style={{
                width: `${(xp / xpToNext) * 100}%`,
                height: '100%',
                transition: 'width 0.3s ease',
                borderRadius: '8px',
              }} />
            </div>
            <div style={{ fontSize: '13px', color: '#D4A84B', fontWeight: 600 }}>
              {xp}/{xpToNext} XP
            </div>
          </div>
          
          {/* Title & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>🐝</span>
              <h1 className="graffiti-text" style={{
                fontSize: '20px',
                color: '#FFD54F',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5), 0 0 10px rgba(255, 213, 79, 0.3)',
              }}>
                МЁдЦентр
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: '10px' }}>
              <div className={penaltyAnimation ? 'alert-red' : 'badge-honey'} style={{
                padding: '8px 16px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>🍯</span>
                <span className="graffiti-text" style={{ fontSize: '17px', color: penaltyAnimation ? '#FFCDD2' : '#3D2914' }}>
                  {balance.toFixed(1)}
                </span>
              </div>
              
              <div className="badge-wood" style={{
                padding: '8px 16px', borderRadius: '12px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>📞</span>
                <span className="graffiti-text" style={{ fontSize: '17px', color: '#FFD54F' }}>
                  {clientQueue.length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Combo indicator */}
          {combo > 1 && (
            <div className="combo-badge" style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              padding: '6px 20px', borderRadius: '12px',
              fontSize: '18px', fontWeight: 700, marginTop: '6px', color: '#FFF',
            }}>
              🔥 КОМБО x{combo}! +{combo * 10}%
            </div>
          )}
          
          {/* Shield indicator */}
          {hasShield && (
            <div className="alert-blue" style={{
              position: 'absolute', top: '100%', right: '18px',
              padding: '6px 14px', borderRadius: '12px',
              fontSize: '14px', fontWeight: 600, marginTop: '6px', color: '#FFF',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              🛡️ Щит: {shieldTimer}с
            </div>
          )}
        </header>
        
        {/* Main content */}
        <main style={{
          flex: 1, overflow: 'auto', padding: '14px',
          paddingTop: combo > 1 ? '56px' : '14px',
          paddingBottom: '190px',
          display: 'flex', flexDirection: 'column', gap: '14px',
          position: 'relative', zIndex: 5,
        }}>
          {/* Operators grid */}
          <section className="wax-panel-real" style={{
            borderRadius: '22px', padding: '18px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 className="graffiti-text" style={{ fontSize: '15px', color: '#3D2914', textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>🐝 Операторы</h2>
              <span className="inset-panel" style={{ 
                fontSize: '13px', 
                padding: '6px 14px', 
                borderRadius: '10px',
                color: '#FFD54F',
              }}>
                {freeOperators}/{operators}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {[...Array(operators)].map((_, i) => {
                const isBusy = busyOperators.has(i)
                return (
                  <div key={i} className={`hex-cell ${isBusy ? 'honeycomb-busy' : 'honeycomb-free'}`} style={{
                    width: '44px', height: '52px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                  }}>
                    <span className={isBusy ? 'pulse' : 'bee-wiggle'}>{isBusy ? '📞' : '🐝'}</span>
                  </div>
                )
              })}
              {[...Array(maxOperators - operators)].map((_, i) => (
                <div key={`e-${i}`} className="hex-cell honeycomb-empty" style={{
                  width: '44px', height: '52px',
                }} />
              ))}
            </div>
          </section>
          
          {/* Queue */}
          <section className="wax-panel-real" style={{
            borderRadius: '22px', padding: '18px',
          }}>
            <h2 className="graffiti-text" style={{ fontSize: '15px', marginBottom: '12px', color: '#3D2914', textShadow: '0 1px 0 rgba(255,255,255,0.3)' }}>
              📨 Входящие <span style={{ opacity: 0.7 }}>⏱️ {Math.max(1.5, 3 - (gameSpeed - 1) * 0.3).toFixed(1)}с</span>
            </h2>
            
            <div className="custom-scrollbar" style={{ display: 'flex', gap: '10px', overflowX: 'auto', minHeight: '56px' }}>
              {clientQueue.length === 0 ? (
                <div className="inset-panel" style={{ 
                  flex: 1, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  opacity: 0.8,
                  color: '#D4A84B',
                  borderRadius: '14px',
                  fontSize: '14px',
                }}>
                  Ожидание звонков...
                </div>
              ) : (
                clientQueue.map((client) => {
                  const isToxic = client.isToxic
                  const isUrgent = client.timeLeft <= 1
                  
                  return (
                    <div key={client.id} className={`slide-in ${isToxic ? 'call-card-toxic' : isUrgent ? 'alert-red' : client.timeLeft <= 2 ? 'alert-orange' : 'alert-green'}`} style={{
                      flexShrink: 0, padding: '10px 14px',
                      borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '8px',
                    }}>
                      <span style={{ fontSize: '18px', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}>{client.type.emoji}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#FFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                        {isToxic ? 'ПАУК!' : client.type.name}
                      </span>
                      <span style={{
                        background: 'rgba(0,0,0,0.35)', padding: '3px 8px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 700, color: '#FFF',
                      }}>
                        {client.timeLeft.toFixed(1)}с
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </section>
          
          {/* Hornet alert */}
          {hornetActive && (
            <section className="alert-red" style={{
              borderRadius: '22px', padding: '14px 18px',
              display: 'flex', alignItems: 'center', gap: '14px',
            }}>
              <div className="honey-drop-real" style={{
                width: '56px', height: '56px',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '30px',
              }}>
                🦅
              </div>
              <div>
                <h3 className="graffiti-text" style={{ color: '#FFF', marginBottom: '4px', textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)', fontSize: '18px' }}>
                  ⚠️ ШЕРШЕНЬ!
                </h3>
                <p style={{ fontSize: '14px', opacity: 0.95, color: '#FFCDD2' }}>
                  {hornetDuration}с • Похищено: {lastCaptured} пчёл
                </p>
              </div>
            </section>
          )}
          
          {/* Stats */}
          <section className="wax-panel-real" style={{
            borderRadius: '20px', padding: '16px',
            display: 'flex', justifyContent: 'space-around',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>💰</div>
              <div className="graffiti-text" style={{ color: '#3D2914', fontSize: '18px' }}>{totalCreditsEarned.toFixed(0)}</div>
              <div style={{ fontSize: '11px', color: '#5D4037', fontWeight: 500 }}>Всего</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>📞</div>
              <div className="graffiti-text" style={{ color: '#3D2914', fontSize: '18px' }}>{totalCallsAnswered}</div>
              <div style={{ fontSize: '11px', color: '#5D4037', fontWeight: 500 }}>Звонков</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🏆</div>
              <div className="graffiti-text" style={{ color: '#3D2914', fontSize: '18px' }}>{highScore.toFixed(0)}</div>
              <div style={{ fontSize: '11px', color: '#5D4037', fontWeight: 500 }}>Рекорд</div>
            </div>
          </section>
          
          {/* Achievements mini */}
          <section className="wax-panel-real" style={{
            borderRadius: '20px', padding: '14px 18px',
            display: 'flex', gap: '10px', flexWrap: 'wrap',
          }}>
            {achievements.map(a => (
              <div key={a.id} className={a.unlocked ? 'achievement-unlocked' : 'achievement-locked'} style={{
                padding: '8px 14px',
                borderRadius: '12px', fontSize: '13px', opacity: a.unlocked ? 1 : 0.5,
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ filter: a.unlocked ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' : 'none' }}>{a.icon}</span>
                <span className="graffiti-text" style={{ fontSize: '11px', color: a.unlocked ? '#3D2914' : '#8D6E63' }}>
                  {a.name}
                </span>
              </div>
            ))}
          </section>
        </main>
        
        {/* Buttons */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '14px 18px',
          background: 'linear-gradient(180deg, transparent, rgba(26, 15, 8, 0.98))',
          zIndex: 20,
        }} className="safe-bottom">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <button onClick={hireBee} disabled={balance < 10 || operators >= maxOperators}
              className={`touch-button ${balance >= 10 && operators < maxOperators ? 'wax-button-real' : 'button-disabled'}`} style={{
                minHeight: '80px', padding: '12px',
                border: 'none',
                borderRadius: '20px',
                cursor: balance >= 10 && operators < maxOperators ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                transform: hireAnimation ? 'translateY(4px)' : 'translateY(0)',
              }}>
              <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>🐝</span>
              <span className="graffiti-text" style={{ fontSize: '15px', color: balance >= 10 && operators < maxOperators ? '#3D2914' : '#8D6E63' }}>
                НАНЯТЬ
              </span>
              <span style={{ fontSize: '12px', opacity: 0.85, color: balance >= 10 && operators < maxOperators ? '#5D4037' : '#8D6E63' }}>-10 🍯</span>
            </button>
            
            <button onClick={answerCall} disabled={freeOperators <= 0 || clientQueue.length === 0}
              className={`touch-button ${freeOperators > 0 && clientQueue.length > 0 ? 'answer-button-real' : 'button-disabled'}`} style={{
                minHeight: '80px', padding: '12px',
                border: 'none',
                borderRadius: '20px',
                cursor: freeOperators > 0 && clientQueue.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
                transform: answerAnimation ? 'translateY(4px)' : 'translateY(0)',
              }}>
              <span style={{ fontSize: '28px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>📞</span>
              <span className="graffiti-text" style={{ fontSize: '15px', color: '#FFF', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}>
                ОТВЕТИТЬ
              </span>
              <span style={{ fontSize: '12px', opacity: 0.95, color: '#E8F5E9' }}>+{combo > 1 ? (1 + combo * 0.1).toFixed(1) : '1'} 🍯</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
