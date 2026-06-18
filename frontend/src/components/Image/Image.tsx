import { useState, forwardRef } from 'react';
import classNames from 'classnames';
import images from '../../assets/images/index';
import styles from './Image.module.scss';
import PropTypes from 'prop-types';

type ImageProps = {
  src?: string;
  alt?: string;
  className?: string;
  fallback?: string;
} & React.ImgHTMLAttributes<HTMLImageElement>;

const Image = forwardRef<HTMLImageElement, ImageProps>(
  ({ src, alt, className, fallback: customFallback = images.noImage, ...props }, ref) => {
    const [fallback, setFallback] = useState('');

    const handleError = () => {
      setFallback(customFallback);
    };

    return (
      <img
        className={classNames(styles.wrapper, className)}
        ref={ref}
        src={fallback || src}
        alt={alt}
        {...props}
        onError={handleError}
      />
    );
  },
);

export default Image;
