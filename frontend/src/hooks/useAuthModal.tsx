import React, { useState } from 'react';
import { useUserStore } from '../redux/hooks';
import Modal from '../components/Modal/Modal';
import Auth from '../components/Auth/Auth';

function useAuthModal() {

    const [showLoginModal, setShowLoginModal] = useState(false);

    const { currentUser } = useUserStore();
    const loginModal = !currentUser && (
        <Modal onCloseModal={() => setShowLoginModal(false)} showModal={showLoginModal}>
            <Auth />
        </Modal>
    )
    return { loginModal, setShowLoginModal };
}

export default useAuthModal;