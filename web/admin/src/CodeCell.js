/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Component } from 'react'
import './App.css'
import { translate as t } from '@doubledutch/admin-client'

export default class CodeCell extends Component {
  constructor() {
    super()
    this.state = {
      isEditing: false,
      isError: false,
      codeName: '',
      codeCat: '',
    }
  }

  componentDidMount() {
    this.setState({ codeName: this.props.code.name, codeCat: this.props.code.categoryId })
  }

  letEdit = () => {
    this.setState({
      isEditing: !this.state.isEditing,
      codeName: this.props.code.name,
      codeCat: this.props.code.categoryId,
    })
    this.props.setCurrentEdit(this.props.code.id)
  }

  saveEdit = () => {
    const isDup = this.props.codes.find(
      code =>
        code.name.toLowerCase() === this.state.codeName.trim().toLowerCase() &&
        code.id !== this.props.code.id,
    )
    if (isDup) {
      this.setState({ isError: true })
    } else {
      this.props.setCodeName(this.props.code.id, this.state.codeName.trim())
      if (this.state.codeCat) {
        this.props.setCodeNumb(this.props.code.id, this.state.codeCat)
      }
      this.props.setCurrentEdit('')
    }
  }

  cancelEdits = () => {
    this.setState({
      isEditing: false,
      codeName: this.props.code.name,
      codeCat: this.props.code.categoryId,
      isError: false,
    })
    this.props.setCurrentEdit('')
  }

  render() {
    const { categoryId, id, name } = this.props.code
    const cat = this.props.categories.find(cat => cat.id === categoryId)
    if (this.props.code.id !== this.props.activeEdit) {
      return (
        <li key={id}>
          <p className="cellName">{name}</p>&nbsp;
          <p className="cellName">{cat ? cat.name : t('unavailable')}</p>
          <div style={{ flex: 1 }} />
          <button className="noBorderButton" onClick={this.letEdit}>
            {t('edit')}
          </button>
          &nbsp;
          <button className="noBorderButton" onClick={this.props.removeCode(this.props.code)}>
            {t('remove')}
          </button>
          &nbsp;
        </li>
      )
    }

    return (
      <li key={id}>
        <input
          className="catNameText"
          autoFocus
          type="text"
          value={this.state.codeName}
          placeholder="QR Code Name"
          onChange={e => this.setState({ codeName: e.target.value, isError: false })}
        />
        &nbsp;
        <select
          value={this.state.codeCat}
          onChange={e => this.setState({ codeCat: e.target.value })}
          className="selectBox"
        >
          <option>{t('selectCat')}</option>
          {this.props.categories.map(c => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        &nbsp;
        <div style={{ flex: 1 }} />
        {this.renderSaveButton()}
        <button className="noBorderButton" onClick={this.cancelEdits}>
          {t('cancel')}
        </button>
        &nbsp;
      </li>
    )
  }

  renderSaveButton = () => {
    if (this.state.isError) {
      return (
        <button className="noBorderButtonRed" onClick={this.saveEdit}>
          {t('rename')}
        </button>
      )
    }
    if (this.state.codeName.trim().length) {
      return (
        <button className="noBorderButton" onClick={this.saveEdit}>
          {t('save')}
        </button>
      )
    }

    return null
  }
}
