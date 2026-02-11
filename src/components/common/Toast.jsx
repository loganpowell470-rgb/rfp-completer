import { useToast } from '../../context/ToastContext';
import Icon from './Icon';
import styles from './Toast.module.css';

export default function Toast() {
  const { toast } = useToast();

  if (!toast) return null;

  return (
    <div key={toast.id} className={styles.toast}>
      <Icon name="check" size={14} />
      <span>{toast.message}</span>
    </div>
  );
}
