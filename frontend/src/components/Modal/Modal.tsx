import PropTypes from 'prop-types';
import { useCallback, useEffect, useState, useRef } from 'react';
import classNames from 'classnames/bind';

import styles from './Modal.module.scss';
import { CloseModalIcon } from '../Icons/Icons';
import Portal from '../Portal/Portal';

const cx = classNames.bind(styles);

function Modal({ children, className, onCloseModal, showModal, videoModal = false }) {
  const [isClosing, setIsClosing] = useState(false);
  const modalRef = useRef(null);

  const handleClose = useCallback(() => {
    if (onCloseModal) {
      if (modalRef.current) {
        setIsClosing(true);
        modalRef.current.addEventListener(
          'animationend',
          () => {
            setIsClosing(false);
            onCloseModal();
          },
          { ones: true },
        );
      }
    }
    return null;
  }, [onCloseModal]);

  const classes = cx('modal-body', {
    [className]: className,
  });

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('hidden');
    }
    return () => {
      if (showModal) {
        document.body.classList.remove('hidden');
      }
    };
  }, [showModal]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.keyCode === 27) {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClose]);

  if (!showModal) return null;

  return (
    <Portal containerId="modal-root">
      <div ref={modalRef} className={cx('wrapper', { isClosing })} onClick={handleClose}>
        <div className={cx('dialog')}>
          <div className={cx('content')} onClick={(e) => e.stopPropagation()}>
            <button className={cx(videoModal ? 'btn-close-video' : 'btn-close')} onClick={handleClose}>
              <CloseModalIcon className={cx('icon')} fill="white" />
            </button>
            <div className={classes}>{children}</div>
          </div>
        </div>
      </div>
    </Portal>
  );
}

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  onCloseModal: PropTypes.func.isRequired,
  showModal: PropTypes.bool.isRequired,
  videoModal: PropTypes.bool,
};

export default Modal;
