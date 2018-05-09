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

export default class CategoryCell extends Component {
  constructor() {
    super()
    this.state = {
      isEditing : false
  }
}

  letEdit = () => {
    this.setState({isEditing: !this.state.isEditing})
  }
  render() {
    const { categoryId, id, name } = this.props.code
    const cat = this.props.categories.find(cat => cat.id === categoryId)
    if (!this.state.isEditing) {
      return (
        <li key={id}>
          <p style={{width: 200}}>{name}</p>&nbsp;
          <p>{cat ? cat.name : "unavailable"}</p>
          <div style={{flex:1}}/>
          <button className="edit" onClick={this.letEdit}>Edit</button>&nbsp;
          <button className="remove" onClick={this.props.removeCode(this.props.code)}>Remove</button>&nbsp;
        </li>
      )
    }
    else {
      return (
        <li key={id}>
          <input className="catNameText" type="text" value={name} placeholder="QR Code Name" onChange={e => this.props.setCodeName(id, e)} />&nbsp;
          <select value={categoryId} onChange={e => this.props.setCodeNumb(id, e)}>
            <option>--Select category--</option>
            { this.props.categories.map(c => <option value={c.id} key={c.id}>{c.name}</option>) }
          </select>&nbsp;
          <div style={{flex:1}}/>
          <button className="edit" onClick={this.letEdit}>Edit</button>&nbsp;
          <button className="remove" onClick={this.props.removeCode(this.props.code)}>Remove</button>&nbsp;
        </li>
      )
    }
  }
}