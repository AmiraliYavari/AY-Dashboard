import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState<string>('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setMessage(msg);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setMessage(''), 2600);
  }, []);

  return { message, showToast };
}
