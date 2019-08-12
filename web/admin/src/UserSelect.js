import React, { useEffect, useState, PureComponent } from 'react'
import './App.css'
import { translate as t } from '@doubledutch/admin-client'
import Modal from 'react-modal'

const UserSelect = ({ user, codes, closeModal, categories, addUserCode, allCodesByUser }) => {
  let scans = {}
  if (user && allCodesByUser) {
    if (allCodesByUser[user.id]) {
      if (allCodesByUser[user.id].scans) scans = allCodesByUser[user.id].scans
    }
  }
  console.log(codes)
  console.log(Object.keys(scans))

  return (
    <Modal
      ariaHideApp={false}
      isOpen={!!user}
      contentLabel="Modal"
      className="Modal"
      overlayClassName="Overlay"
    >
      <div className="modalTop">
        <h1 className="modalTitle">{user ? `${user.firstName} ${user.lastName}` : ''}</h1>
      </div>
      <div>
        <ul className="modalList">
          {codes
            .filter(code => !scans[code.id])
            .map(code => (
              <CodeAddCell
                code={code}
                categories={categories}
                addUserCode={addUserCode}
                user={user}
              />
            ))}
        </ul>
        <div className="modalBottom">
          <button onClick={closeModal} className="formButton">
            {t('close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

const CodeAddCell = ({ user, code, categories, addUserCode }) => {
  const { categoryId, id, name } = code
  const cat = categories.find(cat => cat.id === categoryId)
  return (
    <li key={id}>
      <p className="cellName">{name}</p>&nbsp;
      <p className="cellName">{cat ? cat.name : t('unavailable')}</p>
      <div style={{ flex: 1 }} />
      <button className="noBorderButton" onClick={() => addUserCode(user, code)}>
        +
      </button>
      &nbsp;
    </li>
  )
}

export default UserSelect
