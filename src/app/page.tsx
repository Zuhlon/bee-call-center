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
  const [balance, setBalance] = useState(5)
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
  const [screenShake, setScreenShake] = useState(false)
  
  
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
  const clientTimersRef = useRef<Map<number, NodeJS.Timeout>>(new Map())
  const comboLoopRef = useRef<NodeJS.Timeout | null>(null)

  const freeOperators = operators - busyOperators.size

  // Check for game over - no bees and no honey to hire
  useEffect(() => {
    if (operators === 0 && balance < 1 && !showTutorial) {
      setGameOver(true)
    }
  }, [operators, balance, showTutorial])

  // Restart game
  const restartGame = () => {
    setBalance(5)
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
      setShowTutorial(true)
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
      content: 'Нажмите НАНЯТЬ, чтобы добавить новую пчелу. Стоимость: 1 мёд. Максимум 12 пчёл!',
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
      setHighScore(totalCreditsEarned)
    }
  }, [totalCreditsEarned, highScore])

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
    
    const timer = setInterval(() => {
      setClientQueue(prev => {
        const client = prev.find(c => c.id === newClientId)
        if (client) {
          client.timeLeft -= 0.1
          if (client.timeLeft <= 0) {
            clearInterval(timer)
            clientTimersRef.current.delete(newClientId)
            setBalance(b => Math.max(0, b - 0.1))
            setPenaltyAnimation(true)
            setCombo(0) // Reset combo on miss
            setScreenShake(true)
            setTimeout(() => {
              setPenaltyAnimation(false)
              setScreenShake(false)
            }, 500)
            return prev.filter(c => c.id !== newClientId)
          }
        }
        return [...prev]
      })
    }, 100)
    
    clientTimersRef.current.set(newClientId, timer)
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
    setScreenShake(true)
    
    // Capture 2-10 operators (they disappear from hive completely)
    const captureAmount = Math.min(operators, Math.floor(Math.random() * 9) + 2) // Random 2-10, capped by available
    setLastCaptured(captureAmount)
    setOperators(prev => Math.max(0, prev - captureAmount))
    
    // Visual feedback
    spawnParticles(50, 50, '🦅', 8)
    spawnParticles(50, 50, '💨', 5)
    
    setTimeout(() => {
      setScreenShake(false)
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
      clientTimersRef.current.forEach(timer => clearInterval(timer))
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
    if (balance >= 1 && operators < maxOperators) {
      setHireAnimation(true)
      setBalance(prev => prev - 1)
      setOperators(prev => Math.min(prev + 1, maxOperators))
      spawnParticles(30, 70, '🐝', 5)
      addXp(1)
      setTimeout(() => setHireAnimation(false), 200)
    }
  }, [balance, operators, maxOperators, spawnParticles, addXp])

  // Answer call
  const answerCall = useCallback(() => {
    if (freeOperators <= 0 || clientQueue.length === 0) return
    
    let freeOpIndex = -1
    for (let i = 0; i < operators; i++) {
      if (!busyOperators.has(i)) {
        freeOpIndex = i
        break
      }
    }
    if (freeOpIndex === -1) return
    
    const client = clientQueue[0]
    
    const timer = clientTimersRef.current.get(client.id)
    if (timer) {
      clearInterval(timer)
      clientTimersRef.current.delete(client.id)
    }
    
    setAnswerAnimation(true)
    setClientQueue(prev => prev.slice(1))
    
    // Check for toxic spider call
    if (client.isToxic) {
      // Toxic call - lose 10 credits and show banner!
      setBalance(prev => Math.max(0, prev - 10))
      setCombo(0) // Reset combo
      setScreenShake(true)
      setSpiderVictimBanner(true)
      spawnParticles(50, 50, '🕷️', 15)
      spawnParticles(50, 50, '💀', 10)
      setTimeout(() => {
        setScreenShake(false)
        setAnswerAnimation(false)
        setSpiderVictimBanner(false)
      }, 2500)
      return
    }
    
    // Combo!
    setCombo(prev => prev + 1)
    setComboTimer(3)
    
    setBusyOperators(prev => new Set([...prev, freeOpIndex]))
    setTimeout(() => {
      setBusyOperators(prev => {
        const next = new Set(prev)
        next.delete(freeOpIndex)
        return next
      })
    }, 3000)
    
    // Calculate earning with combo bonus
    let earning = 1.0
    if (hornetActive && Math.random() < 0.4) earning = 0.5
    earning *= (1 + combo * 0.1) // Combo bonus
    
    setBalance(prev => Math.round((prev + earning) * 10) / 10)
    setTotalCreditsEarned(prev => {
      const newTotal = prev + earning
      checkAchievements()
      return newTotal
    })
    setTotalCallsAnswered(prev => prev + 1)
    
    // Effects
    spawnParticles(70, 50, '⭐', 3)
    // Visual feedback for success
    
    addXp(2)
    
    setTimeout(() => setAnswerAnimation(false), 200)
  }, [freeOperators, clientQueue, operators, busyOperators, hornetActive, combo, spawnParticles, addXp, checkAchievements])

  return (
    <>
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-4px) rotate(2deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          25% { transform: translateX(-3px) rotate(-2deg); }
          75% { transform: translateX(3px) rotate(2deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes slideIn {
          0% { transform: translateX(50px) scale(0.8); opacity: 0; }
          100% { transform: translateX(0) scale(1); opacity: 1; }
        }
        @keyframes honeyFlow {
          0%, 100% { 
            background-position: 0% 30%;
          }
          25% { 
            background-position: 30% 70%;
          }
          50% { 
            background-position: 100% 50%;
          }
          75% { 
            background-position: 70% 30%;
          }
        }
        @keyframes levelUp {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); filter: brightness(1.3); }
        }
        @keyframes particleFly {
          0% { opacity: 1; transform: translate(0, 0) scale(1); }
          100% { opacity: 0; transform: translate(var(--vx), var(--vy)) scale(0); }
        }
        @keyframes comboPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes bonusFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-10px) scale(1.1); }
        }
        
        .bee-float { animation: float 1.5s ease-in-out infinite; }
        .hornet-shake { animation: shake 0.3s ease-in-out infinite; }
        .slide-in { animation: slideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .level-up { animation: levelUp 0.5s ease-in-out; }
        .combo-pulse { animation: comboPulse 0.5s ease-in-out infinite; }
        .bonus-float { animation: bonusFloat 1s ease-in-out infinite; cursor: pointer; }
        
        .hex-cell {
          clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
        }
        
        .custom-scrollbar::-webkit-scrollbar { height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(90deg, #fbbf24, #f97316); border-radius: 10px; }
        
        .touch-button {
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          user-select: none;
        }
        
        .touch-button:active { transform: scale(0.95); }
        
        .safe-bottom { padding-bottom: max(16px, env(safe-area-inset-bottom)); }
        .safe-top { padding-top: max(12px, env(safe-area-inset-top)); }
        
        .graffiti-text {
          font-family: 'Arial Black', 'Helvetica Neue', sans-serif;
          font-weight: 900;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        
        .screen-shake {
          animation: shake 0.1s ease-in-out;
        }
        
        
      `}</style>
      
      {/* Main container */}
      <div className={`${screenShake ? 'screen-shake' : ''}`} style={{
        minHeight: '100dvh',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 20%, #b45309 40%, #92400e 60%, #b45309 80%, #f59e0b 100%)',
        backgroundSize: '200% 200%',
        animation: 'honeyFlow 30s ease-in-out infinite',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}>
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
            className="bonus-float"
            onClick={() => collectBonus(bonus)}
            style={{
              position: 'absolute',
              left: `${bonus.x}%`,
              top: `${bonus.y}%`,
              width: '60px',
              height: '60px',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 30px rgba(255,255,255,0.5)',
              border: '3px solid #fbbf24',
              zIndex: 15,
            }}
          >
            {bonus.type.emoji}
          </div>
        ))}
        
        {/* Decorative elements */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
        }}>
          {[...Array(12)].map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: 15 + Math.random() * 40,
              height: 15 + Math.random() * 40,
              background: i % 2 === 0 ? 'rgba(251, 191, 36, 0.12)' : 'rgba(255, 255, 255, 0.06)',
              borderRadius: i % 3 === 0 ? '50%' : '30% 70% 70% 30% / 30% 30% 70% 70%',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }} />
          ))}
        </div>
        
        {/* Level up effect */}
        {levelUpEffect && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            fontSize: '72px', zIndex: 100,
            animation: 'levelUp 0.5s ease-in-out',
            textShadow: '0 0 30px rgba(255,255,255,0.8)',
          }}>
            ⬆️
          </div>
        )}
        
        {/* Achievement popup */}
        {achievementPopup && (
          <div style={{
            position: 'fixed', bottom: '200px', left: '50%', transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #fbbf24, #f97316)',
            borderRadius: '24px', padding: '16px 28px',
            display: 'flex', alignItems: 'center', gap: '14px', zIndex: 100,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            animation: 'slideIn 0.5s ease-out',
          }}>
            <span style={{ fontSize: '36px' }}>{achievementPopup.icon}</span>
            <div>
              <div className="graffiti-text" style={{ color: 'white', fontSize: '16px' }}>
                🏆 {achievementPopup.name}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.9)' }}>
                {achievementPopup.description}
              </div>
            </div>
          </div>
        )}
        
        {/* Spider victim banner */}
        {spiderVictimBanner && (
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(135deg, #7c3aed, #5b21b6)',
            borderRadius: '24px', padding: '24px 32px',
            textAlign: 'center', zIndex: 100,
            boxShadow: '0 8px 40px rgba(124, 58, 237, 0.6), 0 0 60px rgba(124, 58, 237, 0.4)',
            border: '3px solid rgba(255,255,255,0.3)',
            animation: 'slideIn 0.3s ease-out',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🕷️</div>
            <div className="graffiti-text" style={{ color: '#fef08a', fontSize: '20px', marginBottom: '8px' }}>
              ВЫ СТАЛИ ЖЕРТВОЙ ПАУКА!
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#ef4444' }}>
              -10 мёда
            </div>
          </div>
        )}
        
        {/* Game Over screen */}
        {gameOver && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #78350f, #451a03)',
              borderRadius: '32px',
              padding: '40px 32px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7), 0 0 80px rgba(251, 191, 36, 0.2)',
              border: '4px solid #fbbf24',
            }}>
              <div style={{ fontSize: '80px', marginBottom: '20px' }}>😢🐝</div>
              
              <h2 className="graffiti-text" style={{
                fontSize: '24px',
                color: '#fbbf24',
                marginBottom: '16px',
                lineHeight: 1.3,
              }}>
                Пчёлы дотанцевались до упаду
              </h2>
              
              <p style={{
                fontSize: '16px',
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}>
                Попробуйте ещё раз — постройте свою империю мёда и пчёл!
              </p>
              
              <div style={{
                background: 'rgba(0,0,0,0.3)',
                borderRadius: '16px',
                padding: '16px',
                marginBottom: '24px',
              }}>
                <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
                  Ваш результат:
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                  <div>
                    <div style={{ fontSize: '28px' }}>🍯</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{totalCreditsEarned.toFixed(1)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px' }}>⭐</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{level}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '28px' }}>📞</div>
                    <div style={{ fontSize: '18px', fontWeight: 700 }}>{totalCallsAnswered}</div>
                  </div>
                </div>
              </div>
              
              <button
                onClick={restartGame}
                className="touch-button"
                style={{
                  padding: '16px 40px',
                  background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#1f2937',
                  fontSize: '18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.5)',
                }}
              >
                🔄 Начать заново
              </button>
            </div>
          </div>
        )}
        
        {/* Tutorial overlay */}
        {showTutorial && (
          <div style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 200,
            padding: '20px',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b, #312e81)',
              borderRadius: '32px',
              padding: '32px 28px',
              maxWidth: '340px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 80px rgba(139, 92, 246, 0.3)',
              border: '3px solid rgba(139, 92, 246, 0.5)',
            }}>
              {/* Progress dots */}
              <div style={{
                display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px',
              }}>
                {TUTORIAL_STEPS.map((_, i) => (
                  <div key={i} style={{
                    width: '10px', height: '10px',
                    borderRadius: '50%',
                    background: i === tutorialStep ? '#fbbf24' : i < tutorialStep ? '#22c55e' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.3s ease',
                  }} />
                ))}
              </div>
              
              {/* Emoji */}
              <div style={{
                fontSize: '80px',
                marginBottom: '20px',
                animation: 'float 2s ease-in-out infinite',
              }}>
                {TUTORIAL_STEPS[tutorialStep].emoji}
              </div>
              
              {/* Title */}
              <h2 className="graffiti-text" style={{
                fontSize: '22px',
                color: '#fbbf24',
                marginBottom: '16px',
              }}>
                {TUTORIAL_STEPS[tutorialStep].title}
              </h2>
              
              {/* Content */}
              <p style={{
                fontSize: '16px',
                lineHeight: 1.6,
                color: 'rgba(255, 255, 255, 0.9)',
                marginBottom: '28px',
              }}>
                {TUTORIAL_STEPS[tutorialStep].content}
              </p>
              
              {/* Buttons */}
              <div style={{
                display: 'flex', gap: '12px',
                justifyContent: 'center',
              }}>
                <button
                  onClick={closeTutorial}
                  style={{
                    padding: '12px 20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '16px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Пропустить
                </button>
                <button
                  onClick={nextTutorialStep}
                  className="touch-button"
                  style={{
                    padding: '12px 28px',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    border: 'none',
                    borderRadius: '16px',
                    color: '#1f2937',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4)',
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
          padding: '12px 16px',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.1))',
          backdropFilter: 'blur(10px)',
          position: 'relative', zIndex: 10,
        }}>
          {/* Level & XP bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
          }}>
            <div className={levelUpEffect ? 'level-up' : ''} style={{
              background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
              padding: '6px 12px', borderRadius: '12px',
              fontWeight: 700, fontSize: '14px',
              boxShadow: '0 2px 10px rgba(168, 85, 247, 0.5)',
            }}>
              ⭐ Уровень {level}
            </div>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.2)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                width: `${(xp / xpToNext) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {xp}/{xpToNext} XP
            </div>
          </div>
          
          {/* Title & Stats */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '28px' }}>🐝</span>
              <h1 className="graffiti-text" style={{
                fontSize: '18px',
                background: 'linear-gradient(180deg, #fef08a, #fbbf24)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                МЁдЦентр
              </h1>
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{
                background: penaltyAnimation ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                padding: '6px 12px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', gap: '4px',
                border: '2px solid rgba(255,255,255,0.4)',
              }}>
                <span>🍯</span>
                <span className="graffiti-text" style={{ fontSize: '16px', color: '#1f2937' }}>
                  {balance.toFixed(1)}
                </span>
              </div>
              
              <div style={{
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                padding: '6px 12px', borderRadius: '14px',
                display: 'flex', alignItems: 'center', gap: '4px',
                border: '2px solid rgba(255,255,255,0.4)',
              }}>
                <span>📞</span>
                <span className="graffiti-text" style={{ fontSize: '16px', color: 'white' }}>
                  {clientQueue.length}
                </span>
              </div>
            </div>
          </div>
          
          {/* Combo indicator */}
          {combo > 1 && (
            <div className="combo-pulse" style={{
              position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              padding: '4px 16px', borderRadius: '12px',
              fontSize: '18px', fontWeight: 700, marginTop: '4px',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)',
            }}>
              🔥 КОМБО x{combo}! +{combo * 10}%
            </div>
          )}
          
          {/* Shield indicator */}
          {hasShield && (
            <div style={{
              position: 'absolute', top: '100%', right: '16px',
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
              padding: '4px 12px', borderRadius: '12px',
              fontSize: '13px', fontWeight: 600, marginTop: '4px',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              🛡️ Щит: {shieldTimer}с
            </div>
          )}
        </header>
        
        {/* Main content */}
        <main style={{
          flex: 1, overflow: 'auto', padding: '12px',
          paddingTop: combo > 1 ? '50px' : '12px',
          paddingBottom: '180px',
          display: 'flex', flexDirection: 'column', gap: '12px',
          position: 'relative', zIndex: 5,
        }}>
          {/* Operators grid */}
          <section style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '24px', padding: '14px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 className="graffiti-text" style={{ fontSize: '14px' }}>🐝 Операторы</h2>
              <span style={{ fontSize: '12px', background: 'rgba(0,0,0,0.2)', padding: '2px 8px', borderRadius: '8px' }}>
                {freeOperators}/{operators}
              </span>
            </div>
            
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
              {[...Array(operators)].map((_, i) => {
                const isBusy = busyOperators.has(i)
                return (
                  <div key={i} className={`hex-cell ${isBusy ? '' : 'bee-float'}`} style={{
                    width: '38px', height: '42px',
                    background: isBusy ? 'linear-gradient(135deg, #06b6d4, #0891b2)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', border: '2px solid rgba(255,255,255,0.4)',
                    boxShadow: '0 2px 10px rgba(251, 191, 36, 0.4)',
                  }}>
                    {isBusy ? '📞' : '🐝'}
                  </div>
                )
              })}
              {[...Array(maxOperators - operators)].map((_, i) => (
                <div key={`e-${i}`} className="hex-cell" style={{
                  width: '38px', height: '42px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                }} />
              ))}
            </div>
          </section>
          
          {/* Queue */}
          <section style={{
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '24px', padding: '14px',
            border: '3px solid rgba(255, 255, 255, 0.3)',
          }}>
            <h2 className="graffiti-text" style={{ fontSize: '14px', marginBottom: '10px' }}>
              📨 Входящие <span style={{ opacity: 0.6 }}>⏱️ {Math.max(1.5, 3 - (gameSpeed - 1) * 0.3).toFixed(1)}с</span>
            </h2>
            
            <div className="custom-scrollbar" style={{ display: 'flex', gap: '8px', overflowX: 'auto', minHeight: '50px' }}>
              {clientQueue.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                  Ожидание...
                </div>
              ) : (
                clientQueue.map((client) => {
                  const isToxic = client.isToxic
                  const isUrgent = client.timeLeft <= 1
                  
                  return (
                    <div key={client.id} className={`slide-in ${isUrgent ? 'hornet-shake' : ''}`} style={{
                      flexShrink: 0, padding: '8px 12px',
                      background: isToxic 
                        ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
                        : isUrgent 
                          ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                          : client.timeLeft <= 2 
                            ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                            : 'linear-gradient(135deg, #22c55e, #16a34a)',
                      borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '6px',
                      border: isToxic ? '2px solid rgba(139, 92, 246, 0.8)' : '2px solid rgba(255,255,255,0.4)',
                      boxShadow: isToxic ? '0 0 15px rgba(139, 92, 246, 0.6)' : undefined,
                    }}>
                      <span style={{ fontSize: '16px' }}>{client.type.emoji}</span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {isToxic ? 'ПАУК!' : client.type.name}
                      </span>
                      <span style={{
                        background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '6px',
                        fontSize: '11px', fontWeight: 700,
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
            <section className="hornet-shake" style={{
              background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9), rgba(185, 28, 28, 0.8))',
              borderRadius: '24px', padding: '12px 16px',
              border: '3px solid rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '48px', height: '48px',
                background: 'linear-gradient(135deg, #fef08a, #fbbf24)',
                borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '26px',
              }}>
                🦅
              </div>
              <div>
                <h3 className="graffiti-text" style={{ color: '#fef08a', marginBottom: '2px' }}>
                  ⚠️ ШЕРШЕНЬ!
                </h3>
                <p style={{ fontSize: '12px', opacity: 0.9 }}>
                  {hornetDuration}с • Похищено: {lastCaptured}
                </p>
              </div>
            </section>
          )}
          
          {/* Stats */}
          <section style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px', padding: '12px',
            display: 'flex', justifyContent: 'space-around',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>💰</div>
              <div className="graffiti-text">{totalCreditsEarned.toFixed(0)}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>Всего</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>📞</div>
              <div className="graffiti-text">{totalCallsAnswered}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>Звонков</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px' }}>🏆</div>
              <div className="graffiti-text">{highScore.toFixed(0)}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>Рекорд</div>
            </div>
          </section>
          
          {/* Achievements mini */}
          <section style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px', padding: '10px 14px',
            display: 'flex', gap: '8px', flexWrap: 'wrap',
          }}>
            {achievements.map(a => (
              <div key={a.id} style={{
                padding: '6px 10px',
                background: a.unlocked ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'rgba(255,255,255,0.1)',
                borderRadius: '12px', fontSize: '12px', opacity: a.unlocked ? 1 : 0.4,
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                <span>{a.icon}</span>
                <span className="graffiti-text" style={{ fontSize: '10px', color: a.unlocked ? '#1f2937' : 'white' }}>
                  {a.name}
                </span>
              </div>
            ))}
          </section>
        </main>
        
        {/* Buttons */}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          padding: '12px 16px',
          background: 'linear-gradient(180deg, transparent, rgba(0, 0, 0, 0.5))',
          zIndex: 20,
        }} className="safe-bottom">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button onClick={hireBee} disabled={balance < 1 || operators >= maxOperators}
              className="touch-button" style={{
                minHeight: '68px', padding: '10px',
                background: balance >= 1 && operators < maxOperators
                  ? 'linear-gradient(180deg, #fef08a, #fbbf24, #f59e0b)'
                  : 'rgba(255, 255, 255, 0.15)',
                border: '3px solid rgba(255,255,255,0.5)',
                borderRadius: '20px',
                cursor: balance >= 1 && operators < maxOperators ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                opacity: balance >= 1 && operators < maxOperators ? 1 : 0.4,
                transform: hireAnimation ? 'scale(0.95)' : 'scale(1)',
                boxShadow: balance >= 1 && operators < maxOperators ? '0 4px 20px rgba(251, 191, 36, 0.5)' : 'none',
              }}>
              <span style={{ fontSize: '24px' }}>🐝</span>
              <span className="graffiti-text" style={{ fontSize: '14px', color: balance >= 1 && operators < maxOperators ? '#1f2937' : 'rgba(255,255,255,0.5)' }}>
                НАНЯТЬ
              </span>
              <span style={{ fontSize: '11px', opacity: 0.7 }}>-1 ⭐</span>
            </button>
            
            <button onClick={answerCall} disabled={freeOperators <= 0 || clientQueue.length === 0}
              className="touch-button" style={{
                minHeight: '68px', padding: '10px',
                background: freeOperators > 0 && clientQueue.length > 0
                  ? 'linear-gradient(180deg, #86efac, #22c55e, #16a34a)'
                  : 'rgba(255, 255, 255, 0.15)',
                border: '3px solid rgba(255,255,255,0.5)',
                borderRadius: '20px',
                cursor: freeOperators > 0 && clientQueue.length > 0 ? 'pointer' : 'not-allowed',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px',
                opacity: freeOperators > 0 && clientQueue.length > 0 ? 1 : 0.4,
                transform: answerAnimation ? 'scale(0.95)' : 'scale(1)',
                boxShadow: freeOperators > 0 && clientQueue.length > 0 ? '0 4px 20px rgba(34, 197, 94, 0.5)' : 'none',
              }}>
              <span style={{ fontSize: '24px' }}>📞</span>
              <span className="graffiti-text" style={{ fontSize: '14px', color: 'white', textShadow: '1px 1px 0 rgba(0,0,0,0.2)' }}>
                ОТВЕТИТЬ
              </span>
              <span style={{ fontSize: '11px', opacity: 0.8 }}>+{combo > 1 ? (1 + combo * 0.1).toFixed(1) : '1'} ⭐</span>
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
