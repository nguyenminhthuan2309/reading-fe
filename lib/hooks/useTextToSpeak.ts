import { useState, useEffect, useRef, useCallback, RefObject } from 'react';

interface Settings {
    voiceName?: string;
    voiceLang?: string;
    rate?: number;
    pitch?: number;
    volume?: number;
}

interface UseTextToSpeechReturn {
    play: () => void;
    pause: () => void;
    resume: () => void;
    stop: () => void;
    updateSettings: (newSettings: Partial<Settings>) => void;
    isPlaying: boolean;
    isPaused: boolean;
    voices: SpeechSynthesisVoice[];
    getVoiceList: () => void;
    settings: Settings;
}

export function useTextToSpeech(
    ref: RefObject<HTMLElement | null>,
    initialSettings: Partial<Settings> = {}
): UseTextToSpeechReturn {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [settings, setSettings] = useState<Settings>({
        voiceName: '',
        voiceLang: '',
        rate: 1,
        pitch: 1,
        volume: 1,
        ...initialSettings,
    });

    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [highlightedNode, setHighlightedNode] = useState<Node | null>(null);
    const [lastCharIndex, setLastCharIndex] = useState(0);
    const fullTextRef = useRef<string>('');

    const loadVoices = useCallback(() => {
        let availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length) {
            setVoices(availableVoices);
        } else {
            window.speechSynthesis.onvoiceschanged = () => {
                availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
            };
        }
    }, []);

    useEffect(() => {
        loadVoices();
    }, [loadVoices]);

    const getVoice = (): SpeechSynthesisVoice | null => {
        if (settings.voiceName) {
            return voices.find((v) => v.name === settings.voiceName) || null;
        }
        if (settings.voiceLang) {
            return voices.find((v) => v.lang.startsWith(settings.voiceLang!)) || null;
        }
        return null;
    };

    const extractTextNodes = (node: Node): Text[] => {
        const textNodes: Text[] = [];
        const walk = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
        let currentNode = walk.nextNode();
        while (currentNode) {
            if (currentNode.textContent?.trim()) {
                textNodes.push(currentNode as Text);
            }
            currentNode = walk.nextNode();
        }
        return textNodes;
    };

    const clearHighlight = () => {
        if (highlightedNode && highlightedNode.parentElement) {
            highlightedNode.parentElement.classList.remove('tts-highlight');
        }
        setHighlightedNode(null);
    };

    const highlightNode = (node: Node) => {
        clearHighlight();
        if (node.parentElement) {
            node.parentElement.classList.add('tts-highlight');
            setHighlightedNode(node);
        }
    };

    const startUtteranceFrom = useCallback(
        (startIndex: number) => {
            if (!fullTextRef.current) return;
            window.speechSynthesis.cancel();

            setTimeout(() => {
                const utterance = new SpeechSynthesisUtterance(fullTextRef.current.slice(startIndex));
                utterance.voice = getVoice() ?? null;
                utterance.rate = settings.rate!;
                utterance.pitch = settings.pitch!;
                utterance.volume = settings.volume!;

                utterance.onboundary = (event: SpeechSynthesisEvent) => {
                    const absoluteCharIndex = startIndex + event.charIndex;
                    setLastCharIndex(absoluteCharIndex);

                    if (!ref.current) return;
                    const nodes = extractTextNodes(ref.current);
                    let runningLength = 0;
                    for (const node of nodes) {
                        runningLength += node.textContent?.length ?? 0;
                        if (runningLength >= absoluteCharIndex) {
                            highlightNode(node);
                            break;
                        }
                    }
                };

                utterance.onend = () => {
                    clearHighlight();
                    setIsPlaying(false);
                    setIsPaused(false);
                    setLastCharIndex(0);
                };

                utterance.onerror = (e) => {
                    console.error('Speech error', e.error);
                    clearHighlight();
                    setIsPlaying(false);
                    setIsPaused(false);
                };

                utteranceRef.current = utterance;
                window.speechSynthesis.speak(utterance);
                setIsPlaying(true);
            }, 100);
        },
        [settings, voices, ref]
    );

    const play = useCallback(() => {
        if (!ref.current) return;
        window.speechSynthesis.cancel();

        const nodes = extractTextNodes(ref.current);
        if (!nodes.length) return;

        const fullText = nodes.map((n) => n.textContent).join(' ');
        fullTextRef.current = fullText;
        setLastCharIndex(0);

        startUtteranceFrom(0);
    }, [ref, startUtteranceFrom]);

    const pause = () => {
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.pause();
            setIsPaused(true);
        }
    };

    const resume = () => {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
        }
    };

    const stop = () => {
        window.speechSynthesis.cancel();
        clearHighlight();
        setIsPlaying(false);
        setIsPaused(false);
        setLastCharIndex(0);
    };

    const updateSettings = (newSettings: Partial<Settings>) => {
        setSettings((prev) => ({ ...prev, ...newSettings }));
        if (isPlaying) {
            // Stop and restart from last position
            startUtteranceFrom(lastCharIndex);
        }
    };

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, []);

    return {
        play,
        pause,
        resume,
        stop,
        updateSettings,
        isPlaying,
        isPaused,
        voices,
        settings,
        getVoiceList: loadVoices,
    };
}