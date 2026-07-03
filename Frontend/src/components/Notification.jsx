import React, { useEffect } from 'react';
import styles from './Notification.module.css';

const Notification = ({ mensaje, tipo, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Se cierra sola a los 4 segundos

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    return tipo === 'success' ? '✅' : '❌';
  };

  return (
    <div className={`${styles.toast} ${tipo === 'success' ? styles.success : styles.error}`}>
      <span className={styles.icon}>{getIcon()}</span>
      <p className={styles.text}>{mensaje}</p>
      <button className={styles.closeBtn} onClick={onClose}>×</button>
    </div>
  );
};

export default Notification;