import { motion } from 'framer-motion'
import { ArrowRight, Zap, Target, Activity } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function WelcomeScreen() {
  const navigate = useNavigate()

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 }
  }

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const features = [
    {
      icon: Target,
      title: "Einfache Zielsetzung",
      description: "Definiere deine Kalorie- und Makro-Ziele für verschiedene Tagestypen"
    },
    {
      icon: Activity,
      title: "Intelligente Planung",
      description: "Flexible Tagesplanung mit optimaler Makro-Verteilung"
    },
    {
      icon: Zap,
      title: "Schneller Start",
      description: "Nur 2 Steps zum Loslegen!"
    }
  ]

  const handleGetStarted = () => {
    navigate('/onboarding')
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-6 py-12 bg-gradient-to-b from-dark-primary via-dark-secondary to-dark-primary">
      <motion.div
        className="max-w-md w-full text-center space-y-8"
        variants={staggerChildren}
        initial="initial"
        animate="animate"
      >
        {/* App Icon/Logo */}
        <motion.div 
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center shadow-apple-xl">
            <Activity className="w-12 h-12 text-white" strokeWidth={1.5} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div 
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-2"
        >
          <h1 className="text-4xl font-bold text-dark-gray-primary text-balance">
            Willkommen! Tracke deine Makros und Ziele!
          </h1>
          <p className="text-lg text-dark-gray-tertiary text-pretty">
            Für optimale Ergebnisse.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div 
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="space-y-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-start gap-4 p-4 rounded-2xl bg-dark-secondary/50 backdrop-blur-sm border border-dark-quaternary/50"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex-shrink-0 w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                <feature.icon className="w-5 h-5 text-green-500" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-semibold text-dark-gray-primary mb-1">
                  {feature.title}
                </h3>
                <p className="text-sm text-dark-gray-tertiary text-pretty">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div 
          variants={fadeInUp}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="pt-4"
        >
          <motion.button
            onClick={handleGetStarted}
            className="w-full btn-primary flex items-center justify-center gap-3 text-lg font-semibold shadow-apple"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            Jetzt starten
            <ArrowRight className="w-5 h-5" strokeWidth={2} />
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  )
} 