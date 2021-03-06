export const SET_MODAL_VISIBILITY = 'SET_MODAL_VISIBILITY'
export const LOGOUT = 'LOGOUT'

export const setModalVisibilityAction = (modal, visibility) => ({
  type: SET_MODAL_VISIBILITY,
  payload: { modal, visibility },
})

export const logoutAction = () => ({
  type: LOGOUT,
})
