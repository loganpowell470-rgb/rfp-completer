import styles from './Button.module.css';
import Spinner from './Spinner';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${styles.button} ${styles[variant]} ${styles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Spinner size={size === 'sm' ? 14 : 18} />}
      <span className={loading ? styles.loadingText : ''}>{children}</span>
    </button>
  );
}
