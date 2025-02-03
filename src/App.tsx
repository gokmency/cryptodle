import React, { useState, useEffect } from 'react';
import './assets/doodledesign.jpg';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowUp, ArrowDown, Check, X, HelpCircle, Share2, Trophy, Search, Twitter } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { motion, AnimatePresence } from "framer-motion";
import { cryptoData } from './data/cryptoData';
import type { CryptoData } from './types';

interface Feedback {
  name: 'correct' | 'wrong';
  market_cap_rank: 'correct' | 'higher' | 'lower';
  price: 'correct' | 'higher' | 'lower';
  launch_year: 'correct' | 'higher' | 'lower';
  network: 'correct' | 'wrong';
}

interface Guess {
  crypto: CryptoData;
  feedback: Feedback;
}

const CryptodleGame = () => {
  const [targetCrypto, setTargetCrypto] = useState<CryptoData | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [error, setError] = useState('');
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [showStats, setShowStats] = useState(false);
  const [suggestions, setSuggestions] = useState<CryptoData[]>([]);
  const [showShareToast, setShowShareToast] = useState(false);
  const [nextCoinTime, setNextCoinTime] = useState('');

  const [isGuessRevealing, setIsGuessRevealing] = useState(false);

  const updateNextCoinTime = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const timeLeft = tomorrow.getTime() - now.getTime();
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
    
    setNextCoinTime(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
  };



  useEffect(() => {
    // Update countdown every minute
    const timer = setInterval(updateNextCoinTime, 1000);
    updateNextCoinTime(); // Initial update

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Get today's date at midnight
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));
    
    // Load saved game state
    const savedGame = localStorage.getItem('cryptodleGame');
    if (savedGame) {
      const { guesses: savedGuesses, gameStatus: savedGameStatus, dayKey } = JSON.parse(savedGame);
      
      // Only restore if it's the same day
      if (dayKey === daysSinceEpoch) {
        setGuesses(savedGuesses);
        setGameStatus(savedGameStatus);
      } else {
        // Clear saved game if it's a new day
        localStorage.removeItem('cryptodleGame');
      }
    }

    // Load stats
    const savedStats = localStorage.getItem('cryptodleStats');
    if (savedStats) {
      const { streak: savedStreak, bestStreak: savedBestStreak } = JSON.parse(savedStats);
      setStreak(savedStreak);
      setBestStreak(savedBestStreak);
    }
    
    // Use the number of days since epoch as a seed for selecting today's crypto
    const index = daysSinceEpoch % cryptoData.length;
    setTargetCrypto(cryptoData[index]);
  }, []);

  // Save game state whenever it changes
  useEffect(() => {
    if (guesses.length > 0 || gameStatus !== 'playing') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const daysSinceEpoch = Math.floor(today.getTime() / (1000 * 60 * 60 * 24));

      localStorage.setItem('cryptodleGame', JSON.stringify({
        guesses,
        gameStatus,
        dayKey: daysSinceEpoch
      }));
    }
  }, [guesses, gameStatus]);

  const updateStats = (won: boolean) => {
    const newStreak = won ? streak + 1 : 0;
    const newBestStreak = Math.max(bestStreak, newStreak);
    setStreak(newStreak);
    setBestStreak(newBestStreak);
    localStorage.setItem('cryptodleStats', JSON.stringify({
      streak: newStreak,
      bestStreak: newBestStreak
    }));
  };

  const handleGuess = async () => {
    if (!currentGuess || !targetCrypto) return;

    const guessedCrypto = cryptoData.find(
      crypto => crypto.name.toLowerCase() === currentGuess.toLowerCase()
    );

    if (!guessedCrypto) {
      setError('Please select a cryptocurrency from the list');
      return;
    }

    setError('');
    setIsGuessRevealing(true);

    const feedback: Feedback = {
      name: guessedCrypto.name === targetCrypto.name ? 'correct' : 'wrong',
      market_cap_rank: 
        guessedCrypto.market_cap_rank === targetCrypto.market_cap_rank
          ? 'correct'
          : guessedCrypto.market_cap_rank > targetCrypto.market_cap_rank
          ? 'higher'
          : 'lower',
      price:
        guessedCrypto.price === targetCrypto.price
          ? 'correct'
          : guessedCrypto.price > targetCrypto.price
          ? 'higher'
          : 'lower',
      launch_year:
        guessedCrypto.launch_year === targetCrypto.launch_year
          ? 'correct'
          : guessedCrypto.launch_year > targetCrypto.launch_year
          ? 'higher'
          : 'lower',
      network:
        guessedCrypto.network === targetCrypto.network
          ? 'correct'
          : 'wrong'
    };

    const newGuess: Guess = {
      crypto: guessedCrypto,
      feedback
    };

    setGuesses(prev => [...prev, newGuess]);
    setCurrentGuess('');
    setSuggestions([]);

    if (feedback.name === 'correct') {
      setGameStatus('won');
      updateStats(true);
    }

    setTimeout(() => {
      setIsGuessRevealing(false);
    }, 2000);
  };

  const handleShare = () => {
    const emojiMap = {
      correct: '✅',
      wrong: '❌',
      higher: '⬆️',
      lower: '⬇️'
    } as const;

    type EmojiMapKey = keyof typeof emojiMap;

    const shareText = `Cryptodle - ${gameStatus === 'won' ? 'Won' : 'Lost'} in ${guesses.length}/${6}\n\n` +
      guesses.map(guess => 
        Object.values(guess.feedback)
          .map((status: EmojiMapKey) => emojiMap[status])
          .join('')
      ).join('\n');

    navigator.clipboard.writeText(shareText);
    setShowShareToast(true);
    setTimeout(() => setShowShareToast(false), 2000);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setCurrentGuess(input);

    if (input.length > 0) {
      const filteredCryptos = cryptoData
        .filter(crypto => 
          crypto.name.toLowerCase().startsWith(input.toLowerCase()) ||
          crypto.symbol.toLowerCase().startsWith(input.toLowerCase())
        )
        .slice(0, 5); // Show top 5 matches
      setSuggestions(filteredCryptos);
    } else {
      setSuggestions([]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentGuess && gameStatus === 'playing') {
      handleGuess();
    }
  };

  const getFeedbackIcon = (status: 'correct' | 'higher' | 'lower' | 'wrong') => {
    switch (status) {
      case 'correct':
        return <Check className="w-5 h-5 text-emerald-500" strokeWidth={3} />;
      case 'higher':
        return <ArrowDown className="w-5 h-5 text-amber-500" strokeWidth={3} />;
      case 'lower':
        return <ArrowUp className="w-5 h-5 text-amber-500" strokeWidth={3} />;
      default:
        return <X className="w-5 h-5 text-rose-500" strokeWidth={3} />;
    }
  };

  return (
    <div 
      className="w-full h-full min-h-screen" 
      style={{
        backgroundImage: `url('/images/doodledesign.jpg')`,
        backgroundRepeat: 'repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="container mx-auto px-4 py-8">
        <Card className="w-full max-w-2xl mx-auto border rounded-2xl shadow-lg transition-colors duration-300 bg-white border-zinc-200">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b pb-4 transition-colors duration-300">
                <Dialog>
                  <DialogTrigger asChild>
                    <HelpCircle 
                      className="w-6 h-6 cursor-pointer transition-colors duration-200 text-zinc-600 hover:text-emerald-600"
                      strokeWidth={2}
                    />
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border bg-white border-zinc-200">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold">
                        How to Play
                      </DialogTitle>
                      <DialogDescription>
                        <div className="space-y-4 mt-4">
                          <p className="font-medium">Guess a new cryptocurrency every day!</p>
                          <div className="space-y-2">
                            <p>After each guess, you'll get these hints:</p>
                            <div className="space-y-2 text-sm bg-zinc-50 p-3 rounded-lg">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-500" /> <p>Exact match</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowUp className="w-4 h-4 text-amber-500" /> <p>Should be higher</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <ArrowDown className="w-4 h-4 text-amber-500" /> <p>Should be lower</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4 text-rose-500" /> <p>No match</p>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="font-medium">Compared Properties:</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="bg-zinc-50 p-2 rounded-lg flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-amber-500" /> Market Cap Rank
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-500" /> Name
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg flex items-center gap-2">
                                <div className="w-4 h-4 flex items-center justify-center font-bold text-emerald-500">$</div> Price
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg flex items-center gap-2">
                                <div className="w-4 h-4 flex items-center justify-center font-bold text-purple-500">Y</div> Launch Year
                              </div>
                              <div className="bg-zinc-50 p-2 rounded-lg flex items-center gap-2 col-span-2">
                                <div className="w-4 h-4 flex items-center justify-center font-bold text-indigo-500">N</div> Network/Blockchain
                              </div>
                            </div>
                          </div>
                        </div>
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>

                <div className="flex flex-col items-center">
                  <h1 className="text-4xl font-bold text-center text-zinc-800">
                    Cryptodle
                  </h1>
                  <a 
                    href="https://twitter.com/gokmeneth" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-2 text-zinc-500 hover:text-blue-400 transition-colors duration-200"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>

                <Dialog open={showStats} onOpenChange={setShowStats}>
                  <DialogTrigger asChild>
                    <Trophy 
                      className="w-6 h-6 cursor-pointer transition-colors duration-200 text-zinc-600 hover:text-amber-600"
                      strokeWidth={2}
                    />
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border bg-white border-zinc-200">
                    <DialogHeader>
                      <DialogTitle className="text-2xl font-semibold">
                        Your Stats
                      </DialogTitle>
                      <DialogDescription>
                        <div className="space-y-6 mt-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-zinc-50 rounded-xl">
                              <div className="text-3xl font-bold text-zinc-800">{streak}</div>
                              <div className="text-sm text-zinc-600 mt-1">Current Streak</div>
                            </div>
                            <div className="text-center p-4 bg-zinc-50 rounded-xl">
                              <div className="text-3xl font-bold text-zinc-800">{bestStreak}</div>
                              <div className="text-sm text-zinc-600 mt-1">Best Streak</div>
                            </div>
                          </div>
                        </div>
                        {gameStatus !== 'playing' && (
                          <div className="mt-6 text-center">
                            <div className="text-sm text-zinc-600 mb-2">Yeni coin için kalan süre:</div>
                            <div className="text-xl font-semibold text-zinc-800">{nextCoinTime}</div>
                          </div>
                        )}
                        {gameStatus !== 'playing' && (
                          <Button
                            onClick={handleShare}
                            className="w-full mt-6 h-10 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                          >
                            <Share2 className="w-4 h-4 mr-2" strokeWidth={2} />
                            Share Result
                          </Button>
                        )}
                      </DialogDescription>
                    </DialogHeader>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="text-center">
                <p className="text-sm text-zinc-600">
                  Total Guesses: <span className="font-semibold text-zinc-800">
                    {guesses.length}
                  </span>
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="relative">
                <div className="flex space-x-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <Search className="w-4 h-4 text-zinc-600" />
                    </div>
                    <Input
                      type="text"
                      value={currentGuess}
                      onChange={handleInputChange}
                      onKeyPress={handleKeyPress}
                      placeholder="Search crypto by name or symbol..."
                      disabled={gameStatus !== 'playing'}
                      className="pl-10 h-10 text-sm border rounded-lg transition-colors border-zinc-200 focus:ring-2 focus:ring-zinc-200 focus:border-zinc-400"
                    />
                  </div>
                  <Button 
                    onClick={handleGuess}
                    disabled={!currentGuess || gameStatus !== 'playing'}
                    className="h-10 px-6 text-sm font-medium rounded-lg transition-colors bg-zinc-800 hover:bg-zinc-700 text-white"
                  >
                    Guess
                  </Button>
                </div>

                {suggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 border rounded-lg shadow-lg bg-white border-zinc-200">
                    {suggestions.map((crypto) => (
                      <div
                        key={crypto.name}
                        className="px-4 py-3 cursor-pointer text-sm border-b last:border-b-0 text-zinc-600 hover:bg-zinc-50 border-zinc-100"
                        onClick={() => {
                          setCurrentGuess(crypto.name);
                          setSuggestions([]);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{crypto.name}</span>
                            <span className="ml-2 text-zinc-500">
                              {crypto.symbol}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-500">
                            Rank #{crypto.market_cap_rank}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {guesses.length > 0 && (
                <div className="p-4 rounded-xl bg-zinc-50 mb-4">
                  <div className="grid grid-cols-5 gap-4 text-center">
                    <div className="text-sm font-medium text-zinc-800">Name</div>
                    <div className="text-sm font-medium text-zinc-800">Market Cap Rank</div>
                    <div className="text-sm font-medium text-zinc-800">Price</div>
                    <div className="text-sm font-medium text-zinc-800">Launch Year</div>
                    <div className="text-sm font-medium text-zinc-800">Network</div>
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence>
                  {guesses.map((guess, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5, delay: index * 0.2 }}
                      className="grid grid-cols-5 gap-4 p-4 rounded-xl border transition-colors bg-white border-zinc-200"
                    >
                      {['name', 'market_cap_rank', 'price', 'launch_year', 'network'].map((key, colIndex) => (
                        <motion.div
                          key={key}
                          initial={{ rotateX: 90 }}
                          animate={{ rotateX: 0 }}
                          transition={{
                            duration: 0.5,
                            delay: isGuessRevealing ? colIndex * 0.5 : 0,
                            type: 'spring',
                            stiffness: 100
                          }}
                          className="flex items-center justify-center space-x-2 text-zinc-600"
                        >
                          {getFeedbackIcon(guess.feedback[key as keyof Feedback])}
                          <span className="text-sm">
                            {key === 'name' ? guess.crypto.name :
                             key === 'market_cap_rank' ? `#${guess.crypto.market_cap_rank}` :
                             key === 'price' ? `$${guess.crypto.price.toLocaleString()}` :
                             key === 'launch_year' ? guess.crypto.launch_year :
                             guess.crypto.network}
                          </span>
                        </motion.div>
                      ))}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {gameStatus !== 'playing' && (
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-zinc-50">
                    <h2 className="text-xl font-semibold mb-2 text-zinc-800">
                      {gameStatus === 'won' ? '🎉 Well done!' : '🎮 Game Over'}
                    </h2>
                    <div className="text-sm text-zinc-600 mb-4">
                      Yeni coin için kalan süre: <span className="font-semibold text-zinc-800">{nextCoinTime}</span>
                    </div>
                    <p className="text-sm mb-1 text-zinc-600">
                      The crypto was: <span className="font-medium text-zinc-800">{targetCrypto?.name}</span>
                    </p>
                    <p className="text-sm text-zinc-500">{targetCrypto?.description}</p>
                  </div>
                </div>
              )}

              {showShareToast && (
                <div className="fixed bottom-4 right-4 bg-zinc-800 text-white rounded-lg p-3 shadow-lg">
                  <p className="text-sm font-medium">Results copied to clipboard! 📋</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CryptodleGame;