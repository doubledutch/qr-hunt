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

export default class CodeCell extends Component {
  constructor() {
    super()
    this.state = {
      isEditing : false,
      codeName: "",
      codeCat: ""
    }
  }

  componentDidMount() {
    this.setState({catName: this.props.code.name, codeCat: this.props.code.categoryId})
  }

  letEdit = () => {
    this.setState({isEditing: !this.state.isEditing})
    this.props.setCurrentEdit(this.props.code.id)
  }

  saveEdit = () => {
    this.props.setCodeName(this.props.code.id, this.state.codeName)
    this.props.setCodeNumb(this.props.code.id, this.state.codeCat)
    this.props.setCurrentEdit("")
  }


  cancelEdits = () => {
    this.setState({isEditing: false, codeName: this.props.code.name, codeCat: this.props.code.categoryId})
    this.props.setCurrentEdit("")
  }

  render() {
    const { categoryId, id, name } = this.props.code
    const cat = this.props.categories.find(cat => cat.id === categoryId)
    if (this.props.code.id !== this.props.activeEdit) {
      return (
        <li key={id}>
          <p className="cellName">{name}</p>&nbsp;
          <p>{cat ? cat.name : "unavailable"}</p>
          <div style={{flex:1}}/>
          <button className="noBorderButton" onClick={this.letEdit}>Edit</button>&nbsp;
          <button className="noBorderButton" onClick={this.props.removeCode(this.props.code)}>Remove</button>&nbsp;
        </li>
      )
    }
    else {
      return (
        <li key={id}>
          <input className="catNameText" type="text" value={name} placeholder="QR Code Name" onChange={e => this.setState({codeName: e.target.value})} />&nbsp;
          <select value={categoryId} onChange={e => this.setState({codeCat: e.target.value})}>
            <option>--Select category--</option>
            { this.props.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>) }
          </select>&nbsp;
          <div style={{flex:1}}/>
          <button className="noBorderButton" onClick={this.saveEdit}>Save</button>&nbsp;
          <button className="noBorderButton" onClick={this.cancelEdits}>Cancel</button>&nbsp;
        </li>
      )
    }
  }
}