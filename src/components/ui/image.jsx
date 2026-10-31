import * as React from 'react';

const FALLBACK_IMAGE_URL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='120' viewBox='0 0 160 120'%3E%3Crect width='160' height='120' rx='12' fill='%23232730'/%3E%3Cpath d='M45 78l21-24 15 16 13-14 22 22H45z' fill='%23616b7a'/%3E%3Ccircle cx='106' cy='38' r='9' fill='%23616b7a'/%3E%3C/svg%3E";

const Image = React.forwardRef(({ src, onError, ...props }, ref) => {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => setFailed(false), [src]);
  return (
    <img
      ref={ref}
      src={failed || !src ? FALLBACK_IMAGE_URL : src}
      onError={(event) => {
        if (!failed) setFailed(true);
        onError?.(event);
      }}
      {...props}
    />
  );
});

Image.displayName = 'Image';
export { Image };
