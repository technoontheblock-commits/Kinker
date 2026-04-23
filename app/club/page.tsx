'use client'

import { motion } from 'framer-motion'
import { Clock, Shield, Heart, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'

const faqItems = [
  {
    question: 'WHAT ARE YOUR OPENING HOURS?',
    answer: 'The doors to Kinker Club open at 11:00 PM for all events.',
  },
  {
    question: 'WHAT IS THE MINIMUM AGE?',
    answer: 'You can visit us from the age of 18, however, the final decision lies with the doorman. Visitors without a valid ID or passport will be denied entry to the club.',
  },
  {
    question: 'DO YOU HAVE A COAT CHECK?',
    answer: 'Yes, a coat check is available throughout the event.',
  },
  {
    question: 'DO I NEED A TICKET TO PARTY AT YOUR PLACE?',
    answer: 'We usually have ticket pre-sales for all events. If there are tickets remaining before the event, they can be purchased at the door. For guaranteed entry, we recommend purchasing a ticket in advance.',
  },
  {
    question: 'IS THERE A SMOKING AREA?',
    answer: 'We have a covered smoking area on the upper floor.',
  },
  {
    question: 'CAN I PAY WITH CARD AT YOUR PLACE?',
    answer: 'Yes, you can pay with all major bank cards and cash at our door and bar. Euros are only accepted in notes.',
  },
  {
    question: 'I LOST SOMETHING AT YOUR PLACE, WHERE CAN I REPORT IT?',
    answer: 'You can report it HERE.',
  },
  {
    question: 'CAN I CANCEL MY TICKET?',
    answer: 'For ticket cancellations, please contact Eventfrog directly.',
  },
]

export default function ClubPage() {
  return (
    <div className="min-h-screen bg-black pt-24 lg:pt-32">
      {/* Header */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="text-red-500 font-semibold tracking-widest uppercase text-sm mb-4 block">
            About Us
          </span>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter font-display text-white mb-6">
            THE CLUB
          </h1>
        </motion.div>
      </section>

      {/* About Us */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl"
        >
          <p className="text-lg md:text-xl text-white/70 leading-relaxed mb-8">
            From the outset, there&apos;s nothing to suggest that everything here is different from 
            elsewhere at Kinker. A simple yet tastefully designed club, geared towards dancing. Good 
            lighting, an equally impressive sound system, and a spacious bar... Club business as usual, 
            really. But then, on weekends at 11 PM, a nocturnal world underscored by techno at 140+ bpm 
            unfolds across three floors, offering a glimpse into the near future of clubbing and electronic 
            music. The Kinker crowd loves its music hard, is LGBTQ+ friendly, and tolerant in all directions, 
            but without shoving it in people&apos;s faces in a preachy manner. It&apos;s just the way it is; 
            they know no different. Open-mindedness is paramount. Here, men kiss men, women kiss women, 
            and it&apos;s absolutely (excuse the expression) irrelevant where you come from, how you look, 
            or what you do in everyday life – the moment you step over the threshold, you&apos;re immediately 
            part of the community.
          </p>
          <p className="text-white/40 text-sm italic">
            Source: Alex Flach, starzone.ch Article May 2022
          </p>
        </motion.div>
      </section>

      {/* Our Values */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900/50 rounded-2xl p-8 lg:p-12 border border-white/10"
        >
          <div className="flex items-center gap-4 mb-8">
            <Heart className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-white font-display">Our Values</h2>
          </div>
          <div className="max-w-4xl">
            <p className="text-lg text-white/70 leading-relaxed mb-6">
              Kinker is a safe space for all! Beyond our premises, we value respectful interactions 
              with all individuals. Our concept is built on respect, equality, and diversity – everyone 
              is welcome here! We only tolerate peaceful and loving individuals in our club! If you feel 
              uncomfortable or notice anything, don&apos;t hesitate to contact our security, bar, or event 
              staff! You&apos;ll always find someone here to listen to you and help.
            </p>
            <div className="flex flex-wrap gap-3">
              {['NO SEXISM', 'NO RACISM', 'NO HATE'].map((tag) => (
                <span
                  key={tag}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 font-semibold text-sm tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Location */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-4 mb-8">
              <MapPin className="w-8 h-8 text-red-500" />
              <h2 className="text-3xl font-bold text-white font-display">Location</h2>
            </div>
            <p className="text-white/70 leading-relaxed mb-6">
              The Kinker Club is located in the heart of the industrial area of Basel. You can easily 
              reach us on foot from the tram, bus, and train station &quot;Dreispitz,&quot; which is in close 
              proximity. We&apos;re not far from the SBB train station and have direct connections with 
              public transportation, as well as accessibility via private vehicles, taxis, or Uber. If 
              you&apos;re arriving by car, we kindly ask you to use the parking garage opposite the club.
            </p>
            <div className="p-6 bg-black/50 rounded-lg border border-white/5">
              <p className="text-white font-semibold mb-1">Kinker Club</p>
              <p className="text-white/60">Barcelona-Strasse 4</p>
              <p className="text-white/60">4142 Münchenstein / Basel</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-red-500/10 blur-2xl rounded-full" />
            <div className="relative bg-neutral-900/80 backdrop-blur-sm rounded-2xl p-8 border border-white/10 h-full flex flex-col justify-center">
              <h3 className="text-2xl font-bold text-white mb-4 font-display">
                How to Find Us
              </h3>
              <ul className="space-y-3">
                {[
                  'Tram / Bus / Train: Station "Dreispitz" (walking distance)',
                  'SBB Train Station: Short ride with public transport',
                  'By Car: Parking garage opposite the club',
                  'Taxi / Uber: Direct drop-off possible',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <span className="text-white/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Opening Hours */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="bg-neutral-900/50 rounded-2xl p-8 lg:p-12 border border-white/10"
        >
          <div className="flex items-center gap-4 mb-8">
            <Clock className="w-8 h-8 text-red-500" />
            <h2 className="text-3xl font-bold text-white font-display">Opening Hours</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-black/50 rounded-lg border border-white/5">
              <h3 className="text-red-500 font-semibold mb-2">Friday</h3>
              <p className="text-2xl font-bold text-white">23:00 - 07:00</p>
              <p className="text-white/50 text-sm mt-2">Weekend Kick-off</p>
            </div>
            <div className="p-6 bg-black/50 rounded-lg border border-white/5">
              <h3 className="text-red-500 font-semibold mb-2">Saturday</h3>
              <p className="text-2xl font-bold text-white">23:00 - 07:00</p>
              <p className="text-white/50 text-sm mt-2">Main Event Night</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* FAQ */}
      <section className="container mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-bold text-white mb-12 font-display"
        >
          Frequently Asked Questions
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="p-6 bg-neutral-900/30 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <h3 className="text-lg font-bold text-white mb-2">{item.question}</h3>
              <p className="text-white/60 leading-relaxed">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
