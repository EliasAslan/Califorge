import { useEffect } from 'react';

// The console is always dark, including the overscroll gutter behind it.
// Restore the app chrome as soon as the user leaves the session.
export default function useConsoleChrome() {
  useEffect(() => {
    const { body } = document;
    const previous = {
      backgroundImage: body.style.backgroundImage,
      backgroundColor: body.style.backgroundColor,
      colorScheme: body.style.colorScheme,
    };

    body.style.backgroundImage = 'none';
    body.style.backgroundColor = '#0B0C0D';
    body.style.colorScheme = 'dark';

    return () => {
      body.style.backgroundImage = previous.backgroundImage;
      body.style.backgroundColor = previous.backgroundColor;
      body.style.colorScheme = previous.colorScheme;
    };
  }, []);
}
