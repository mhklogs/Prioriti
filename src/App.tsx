/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { 
  Plus, 
  Trash2, 
  Bell, 
  BellOff, 
  Wifi, 
  WifiOff, 
  Tag, 
  X, 
  Info, 
  Flame, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task } from './types';

// Default tasks for a rich starting experience
const DEFAULT_TASKS: Task[] = [
  {
    id: 'default-1',
    task_name: 'Compile and test core server integration scripts',
    importance: 5,
    difficulty: 4,
    score: 20,
    completed: false,
    created_at: new Date(Date.now() - 15000).toISOString(), // 15s ago, triggers notification quickly
    ai_generated: true,
    context_tags: ['dev', 'high-priority', 'system'],
    notified: false
  },
  {
    id: 'default-2',
    task_name: 'Design minimalist visual assets for the pitch deck',
    importance: 4,
    difficulty: 3,
    score: 12,
    completed: false,
    created_at: new Date(Date.now() - 8000).toISOString(),
    ai_generated: false,
    context_tags: ['design', 'client'],
    notified: false
  },
  {
    id: 'default-3',
    task_name: 'Review feedback and pull requests for prioriti. UI',
    importance: 3,
    difficulty: 2,
    score: 6,
    completed: true,
    created_at: new Date(Date.now() - 60000).toISOString(),
    ai_generated: false,
    context_tags: ['review'],
    notified: false
  }
];

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export default function App() {
  // State variables
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskName, setTaskName] = useState('');
  const [importance, setImportance] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [tagInput, setTagInput] = useState('');
  const [contextTags, setContextTags] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // Initialize and check online state and notification permissions
  useEffect(() => {
    // Load tasks from LocalStorage
    const stored = localStorage.getItem('prioriti_tasks');
    if (stored) {
      try {
        setTasks(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse stored tasks, loading defaults', e);
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
      localStorage.setItem('prioriti_tasks', JSON.stringify(DEFAULT_TASKS));
    }

    // Event listeners for online/offline status
    const handleOnline = () => {
      setIsOnline(true);
      showToast('System is back online. Agent synchronization ready.', 'success');
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToast('System is offline. Running in secure local-first mode.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial notification permission check
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // PWA Install checks
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsInstalled(!!isStandaloneMode);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      showToast('prioriti. has been successfully installed!', 'success');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Sync state to localStorage on any modification
  const saveTasks = (updatedTasks: Task[]) => {
    setTasks(updatedTasks);
    localStorage.setItem('prioriti_tasks', JSON.stringify(updatedTasks));
  };

  // Automated notification handler (runs every second to scan for urgent uncompleted tasks)
  useEffect(() => {
    const checkUrgentTasks = () => {
      const now = Date.now();
      let modified = false;
      const updatedTasks = tasks.map(task => {
        // Condition: score >= 15, uncompleted, older than 10 seconds, not already notified
        const taskAgeMs = now - new Date(task.created_at).getTime();
        const shouldAlert = 
          !task.completed && 
          task.score >= 15 && 
          taskAgeMs >= 10000 && 
          !task.notified;

        if (shouldAlert) {
          modified = true;
          triggerNotification(task);
          return { ...task, notified: true };
        }
        return task;
      });

      if (modified) {
        saveTasks(updatedTasks);
      }
    };

    const intervalId = setInterval(checkUrgentTasks, 2000);
    return () => clearInterval(intervalId);
  }, [tasks]);

  // Toast dispatch utility
  const showToast = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  // Triggers native system push notification + fallback elegant in-app toast
  const triggerNotification = (task: Task) => {
    const title = `Urgent priority: ${task.task_name}`;
    const options = {
      body: `Calculated Priority Score: ${task.score} (Importance: ${task.importance}, Difficulty: ${task.difficulty}) requires your focus immediately.`,
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };

    // Attempt Native HTML5 Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, options);
      } catch (err) {
        console.error('Failed to trigger native notification inside iframe', err);
      }
    }

    // Beautiful in-app high-visibility warning notification (guarantees iframe visibility)
    showToast(`Urgent priority pending: "${task.task_name}" requires your focus.`, 'warning');
  };

  // Request system notification permissions
  const requestNotificationPermission = () => {
    if (!('Notification' in window)) {
      showToast('System alerts are not supported by this browser.', 'warning');
      return;
    }

    Notification.requestPermission().then(permission => {
      setNotificationPermission(permission);
      if (permission === 'granted') {
        showToast('System alerts successfully authorized.', 'success');
        // Trigger a test notification immediately to confirm
        new Notification('System Alerts Enabled', {
          body: 'prioriti. will now alert you of urgent uncompleted priorities.',
          icon: '/icon-192.png'
        });
      } else if (permission === 'denied') {
        showToast('Notification permission denied. Please allow notifications in your site settings.', 'info');
      }
    });
  };

  // Trigger PWA installation prompt or show manual instructions
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to install: ${outcome}`);
      setDeferredPrompt(null);
    } else {
      // Show platform-specific install instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      if (isIOS) {
        showToast("To install on iOS: Tap the Share button in Safari, then select 'Add to Home Screen'.", 'info');
      } else {
        showToast("To install: Open your browser menu (three dots) and select 'Install prioriti.' or 'Add to Home screen'.", 'info');
      }
    }
  };

  // Adding a new tag from the input
  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !contextTags.includes(tag)) {
      setContextTags(prev => [...prev, tag]);
    }
    setTagInput('');
  };

  // Removing a context tag
  const handleRemoveTag = (tagToRemove: string) => {
    setContextTags(prev => prev.filter(t => t !== tagToRemove));
  };

  // Add Task handler
  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    const cleanName = taskName.trim();
    if (!cleanName) return;

    const parsedImportance = importance;
    const parsedDifficulty = difficulty;
    const calculatedScore = parsedImportance * parsedDifficulty;

    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      task_name: cleanName,
      importance: parsedImportance,
      difficulty: parsedDifficulty,
      score: calculatedScore,
      completed: false,
      created_at: new Date().toISOString(),
      ai_generated: false,
      context_tags: [...contextTags],
      notified: false
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    // Reset Form Fields
    setTaskName('');
    setImportance(3);
    setDifficulty(3);
    setContextTags([]);
    setTagInput('');

    showToast('Task added to priority stack.', 'success');
  };

  // Checkbox completed flow toggle
  const handleToggleTask = (id: string) => {
    const updated = tasks.map(task => {
      if (task.id === id) {
        const completed = !task.completed;
        return { 
          ...task, 
          completed,
          // Reset notification status if toggled back to incomplete
          notified: completed ? task.notified : false 
        };
      }
      return task;
    });
    saveTasks(updated);
  };

  // Delete task handler
  const handleDeleteTask = (id: string) => {
    const updated = tasks.filter(task => task.id !== id);
    saveTasks(updated);
    showToast('Task deleted from stack.', 'info');
  };

  // Clear all completed tasks
  const handleClearCompleted = () => {
    const completedCount = completedTasks.length;
    if (completedCount === 0) return;
    const updated = tasks.filter(task => !task.completed);
    saveTasks(updated);
    showToast(`${completedCount} completed task${completedCount === 1 ? '' : 's'} cleared from the stack.`, 'success');
  };

  // Reset to default starting list
  const handleResetDefaults = () => {
    saveTasks(DEFAULT_TASKS);
    showToast('Priority stack reset to factory defaults.', 'info');
  };

  // Dynamic list sorting protocol:
  // Active (uncompleted) tasks first, sorted descending by Priority Score.
  // Completed tasks next, sorted descending by Priority Score.
  const activeTasks = tasks
    .filter(t => !t.completed)
    .sort((a, b) => b.score - a.score);

  const completedTasks = tasks
    .filter(t => t.completed)
    .sort((a, b) => b.score - a.score);

  const sortedTasks = [...activeTasks, ...completedTasks];

  return (
    <div className="min-h-screen bg-app-bg text-text-primary px-4 py-8 md:py-16 transition-colors duration-300">
      
      {/* Toast Overlay System */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 pointer-events-auto ${
                toast.type === 'warning' 
                  ? 'bg-[var(--color-accent-soft)] text-[var(--color-accent-dark)] border-border-custom' 
                  : toast.type === 'success' 
                  ? 'bg-[#EEF3EE] text-[#3F6B45] border-border-custom' 
                  : 'bg-card-bg text-text-primary border-border-custom'
              }`}
            >
              <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">{toast.message}</div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="max-w-[650px] w-full mx-auto flex flex-col gap-8 md:gap-12">
        
        {/* Header Zone */}
        <header className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-display tracking-tight text-text-primary select-none flex items-center gap-1.5">
              prioriti<span className="text-accent-custom">.</span>
            </h1>
            <p className="text-xs text-text-muted mt-1 font-medium">intelligent task ranking system</p>
          </div>

          <div className="flex items-center gap-2">
            {!isInstalled ? (
              <button
                onClick={handleInstallClick}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary border border-border-custom rounded-full px-4 py-2 transition-colors cursor-pointer"
                title="Install prioriti. as a native app on your device"
              >
                <Plus className="w-3.5 h-3.5" />
                Install app
              </button>
            ) : (
              <div 
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F6B45] rounded-full px-4 py-2 border border-border-custom"
                title="prioriti. is running in native app mode"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#3F6B45]" />
                Installed
              </div>
            )}
          </div>
        </header>

        {/* Input Station Container */}
        <section className="bg-card-bg border border-border-custom rounded-2xl p-5 md:p-6 shadow-sm transition-colors duration-300">
          <form onSubmit={handleAddTask} className="flex flex-col gap-4">
            
            {/* Text Input Row */}
            <div className="relative">
              <input
                type="text"
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full bg-transparent text-lg text-text-primary placeholder-text-muted border-b border-border-custom/60 py-3 px-1 font-medium transition-colors focus:border-accent-custom"
                required
              />
              {taskName.trim() && (
                <button
                  type="button"
                  onClick={() => setTaskName('')}
                  className="absolute right-2 top-4 text-text-muted hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
              
              {/* Importance Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Importance <span className="text-text-primary font-semibold">({importance})</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={`imp-${val}`}
                      type="button"
                      onClick={() => setImportance(val)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        importance === val
                          ? 'bg-accent-custom border-accent-custom text-white'
                          : 'bg-app-bg border-border-custom text-text-muted hover:text-text-primary hover:border-text-muted'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-text-muted">
                  Difficulty <span className="text-text-primary font-semibold">({difficulty})</span>
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(val => (
                    <button
                      key={`diff-${val}`}
                      type="button"
                      onClick={() => setDifficulty(val)}
                      className={`flex-1 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        difficulty === val
                          ? 'bg-accent-custom border-accent-custom text-white'
                          : 'bg-app-bg border-border-custom text-text-muted hover:text-text-primary hover:border-text-muted'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Context Tags Selector Row */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="text-xs font-medium text-text-muted">
                Context tags <span className="text-text-muted/70">(optional)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-2.5 w-4 h-4 text-text-muted" />
                  <input
                    type="text"
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="e.g. work, family, health — press Enter"
                    className="w-full bg-app-bg text-xs border border-border-custom rounded-full pl-9 pr-14 py-2 text-text-primary transition-all placeholder:text-text-muted"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="absolute right-1.5 top-1.5 bg-card-bg hover:bg-border-custom border border-border-custom text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors text-text-primary"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Selected Tags List */}
              <AnimatePresence>
                {contextTags.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-1.5 mt-1.5 overflow-hidden"
                  >
                    {contextTags.map(tag => (
                      <span 
                        key={`tag-${tag}`} 
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-app-bg border border-border-custom text-[11px] rounded-full text-text-primary"
                      >
                        #{tag}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add Button Area */}
            <div className="flex items-center justify-between border-t border-border-custom/50 pt-4 mt-2">
              <div className="flex items-center gap-2">
                <div className="text-xs text-text-muted">
                  Score <span className="text-text-primary font-semibold">{importance * difficulty}</span>/25
                </div>
                {importance * difficulty >= 15 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-accent-custom">
                    <Flame className="w-3 h-3" /> High priority
                  </span>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 border border-transparent bg-text-primary text-app-bg hover:-translate-y-0.5 hover:border-accent-custom font-semibold text-sm py-2.5 px-7 rounded-full transition-all active:scale-[0.98] cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add task
              </button>
            </div>

          </form>
        </section>

        {/* Configuration Bar: Notification Authorization & Reset to Factory */}
        <section className="flex flex-col sm:flex-row items-center justify-between gap-4 border border-border-custom rounded-2xl p-4 bg-card-bg">
          <div className="flex items-center gap-3">
            <button
              onClick={requestNotificationPermission}
              className={`inline-flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-full border transition-all cursor-pointer ${
                notificationPermission === 'granted'
                  ? 'bg-[#EEF3EE] text-[#3F6B45] border-border-custom'
                  : 'bg-app-bg text-text-primary border-border-custom hover:border-text-muted'
              }`}
            >
              {notificationPermission === 'granted' ? (
                <>
                  <Bell className="w-4 h-4" /> Moving — alerts active
                </>
              ) : (
                <>
                  <BellOff className="w-4 h-4 text-text-muted" /> Enable notifications
                </>
              )}
            </button>
            <div className="hidden md:block text-[10px] text-text-muted max-w-[200px] leading-relaxed">
              Alerts you when an urgent item sits uncompleted.
            </div>
          </div>

          <button
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-primary border border-border-custom px-4 py-2 rounded-full transition-all cursor-pointer"
            title="Reload the starting list"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset to defaults
          </button>
        </section>

        {/* Priority Stack Container */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between select-none px-1">
            <h2 className="text-lg font-display text-text-primary flex items-baseline gap-2">
              The priority stack
              <span className="text-xs font-normal text-text-muted">
                {activeTasks.length} active · {completedTasks.length} completed
              </span>
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-[11px] text-text-muted">
                Sorted by score
              </div>
              {completedTasks.length > 0 && (
                <button
                  onClick={handleClearCompleted}
                  className="text-[11px] font-medium text-text-muted hover:text-red-600 transition-colors cursor-pointer"
                  title={`Remove ${completedTasks.length} completed task${completedTasks.length === 1 ? '' : 's'}`}
                >
                  Clear completed
                </button>
              )}
            </div>
          </div>

          {/* Task rows */}
          <div className="flex flex-col gap-2 relative">
            <AnimatePresence initial={false}>
              {sortedTasks.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-border-custom rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-2 bg-card-bg/20"
                >
                  <p className="text-sm font-medium text-text-muted">The stack is completely empty.</p>
                  <p className="text-xs text-text-muted/60">Create a task above to rank its priority score instantly.</p>
                </motion.div>
              ) : (
                sortedTasks.map((task) => {
                  const isHighPriority = task.score >= 15 && !task.completed;
                  return (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ 
                        opacity: task.completed ? 0.5 : 1, 
                        y: 0, 
                        scale: 1,
                        transition: { type: 'spring', stiffness: 300, damping: 30 }
                      }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className={`flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-colors duration-300 relative overflow-hidden group hover:-translate-y-0.5 ${
                        task.completed 
                          ? 'bg-card-bg/40 border-border-custom/50 text-text-muted' 
                          : isHighPriority
                          ? 'bg-card-bg border-accent-custom/50 hover:border-accent-custom'
                          : 'bg-card-bg border-border-custom hover:border-text-muted/40'
                      }`}
                      style={{
                        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, opacity 0.4s ease'
                      }}
                    >
                      {/* Left Side: Checkbox, Name, Tags */}
                      <div className="flex items-start gap-4 flex-1 mr-4">
                        
                        {/* Custom Low-Profile Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task.id)}
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all flex-shrink-0 mt-0.5 cursor-pointer ${
                            task.completed
                              ? 'bg-accent-custom/15 border-accent-custom text-accent-custom'
                              : isHighPriority
                              ? 'border-accent-custom hover:bg-accent-custom/10'
                              : 'border-border-custom hover:border-text-primary hover:bg-text-primary/5'
                          }`}
                        >
                          {task.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ duration: 0.15 }}
                              className="w-2.5 h-2.5 rounded-full bg-accent-custom"
                            />
                          )}
                        </button>

                        {/* Task metadata/text */}
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <span 
                            className={`text-sm md:text-base font-medium leading-normal break-words transition-all ${
                              task.completed 
                                ? 'line-through text-text-muted/60 decoration-text-muted/40' 
                                : 'text-text-primary'
                            }`}
                          >
                            {task.task_name}
                          </span>

                          {/* Extra Metadata, badges, tags */}
                          <div className="flex flex-wrap items-center gap-1.5 select-none">
                            <span className="text-[11px] font-medium text-text-muted/80 bg-app-bg px-1.5 py-0.5 rounded-md border border-border-custom/60">
                              imp {task.importance}
                            </span>
                            <span className="text-[11px] font-medium text-text-muted/80 bg-app-bg px-1.5 py-0.5 rounded-md border border-border-custom/60">
                              diff {task.difficulty}
                            </span>
                            {task.ai_generated && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] text-text-muted px-1.5 py-0.5 bg-app-bg rounded-md border border-border-custom/60">
                                <Sparkles className="w-2.5 h-2.5" /> ai
                              </span>
                            )}
                            {task.context_tags && task.context_tags.map(tag => (
                              <span 
                                key={`badge-${task.id}-${tag}`} 
                                className="text-[11px] text-text-muted/80 px-1.5 py-0.5 bg-app-bg border border-border-custom/60 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>

                      </div>

                      {/* Right Side: Score, Actions */}
                      <div className="flex items-center gap-4">
                        
                        {/* Priority Score Display */}
                        <div className="flex flex-col items-end select-none">
                          <div 
                            className={`text-2xl font-bold tracking-tighter ${
                              task.completed
                                ? 'text-text-muted/40'
                                : isHighPriority
                                ? 'text-accent-custom'
                                : 'text-text-primary'
                            }`}
                          >
                            {task.score}
                          </div>
                          <div className="text-[10px] text-text-muted">
                            score
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-text-muted hover:text-red-600 hover:bg-red-500/10 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 flex-shrink-0 cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>

                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-8 border-t border-border-custom/60 pt-6 text-center flex flex-col items-center gap-2 select-none">
          <div className="text-xs text-text-muted flex items-center gap-2">
            <span>Offline-first task prioritizer</span>
            <span className="text-border-custom">·</span>
            <span>Ranks by importance × difficulty</span>
            <span className="text-border-custom">·</span>
            <span>Works without a network</span>
          </div>
          <div className="text-[11px] text-text-muted/60 italic">
            Priority score = Importance (1–5) × Difficulty (1–5). Higher first.
          </div>
        </footer>

      </main>
    </div>
  );
}
