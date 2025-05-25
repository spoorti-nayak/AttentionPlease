
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, LogIn } from "lucide-react";

const Welcome = () => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Trigger animation completion after a delay
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-blue-50 dark:from-background dark:to-gray-900 p-4">
      <div className="w-full max-w-md flex flex-col items-center text-center space-y-8">
        {/* Logo animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center space-x-2 mb-2"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="h-5 w-5 rounded-full bg-attention-blue-400"
          ></motion.span>
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="h-5 w-5 rounded-full bg-attention-green-400"
          ></motion.span>
        </motion.div>

        {/* Title animation */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary"
        >
          Attention Please!
        </motion.h1>

        {/* Subtitle animation */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: animationComplete ? 1 : 0 }}
          transition={{ duration: 0.6 }}
          className="text-lg text-muted-foreground max-w-sm"
        >
          Your digital wellness companion for productive focus and healthy eyes
        </motion.p>

        {/* Buttons animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: animationComplete ? 1 : 0, y: animationComplete ? 0 : 20 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 w-full mt-8"
        >
          <Button asChild className="flex-1 rounded-full py-6" size="lg">
            <Link to="/signup">
              Get Started <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="flex-1 rounded-full py-6" size="lg">
            <Link to="/login">
              Login <LogIn className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Welcome;
