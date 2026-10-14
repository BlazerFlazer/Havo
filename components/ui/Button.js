import styles from './Button.module.css';

/**
 * Button / link with consistent states (hover, focus, active, disabled, loading).
 * Renders <a> when `href` is provided, otherwise <button>.
 */
export function Button({
  href,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'end',
  loading = false,
  block = false,
  className = '',
  children,
  type = 'button',
  disabled,
  ...rest
}) {
  const cls = [
    styles.btn,
    styles[variant],
    styles[size],
    block ? styles.block : '',
    !children ? styles.iconOnly : '',
    loading ? styles.loading : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconEl = loading ? (
    <span className={styles.spinner} aria-hidden="true" />
  ) : Icon ? (
    <Icon
      className={`${styles.icon} ${iconPosition === 'end' ? styles.iconEnd : styles.iconStart}`}
      size={size === 'sm' ? 16 : 18}
      strokeWidth={2}
      aria-hidden="true"
    />
  ) : null;

  const content = (
    <>
      {iconPosition === 'start' && iconEl}
      {children && <span className={styles.label}>{children}</span>}
      {iconPosition === 'end' && iconEl}
    </>
  );

  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
}
