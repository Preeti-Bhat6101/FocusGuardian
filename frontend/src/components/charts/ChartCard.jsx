// src/components/charts/ChartCard.jsx
import React from 'react';
import { motion } from 'framer-motion';

// This component will apply the card styling and a staggered animation effect.
const cardVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: [0.4, 0, 0.2, 1] 
    }
  }
};
function ChartCard({ children }) {
  return (
    <motion.div
      className="chart-item"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
    >
      {children}
    </motion.div>
  );
}

export default ChartCard;