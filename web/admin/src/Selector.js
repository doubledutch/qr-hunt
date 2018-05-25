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

import React, { PureComponent } from 'react'
import FontAwesomeIcon from '@fortawesome/react-fontawesome'
import faSearch from '@fortawesome/fontawesome-free-solid/faSearch'
import faTimes from '@fortawesome/fontawesome-free-solid/faTimes'
import {TextInput} from '@doubledutch/react-components'
import './Selector.css'

export default class Selector extends PureComponent {
  render() {
    const {className, onSelected, onDeselected, searchTitle, selectedTitle, selected, selectedTextFn} = this.props
    return (
      <div className={`selector-row ${className}`}>
        <SearchInput label={searchTitle} />
        <label>
          {selectedTitle}
          <div className="selector-tiles horizontal space-children">
            {selected.map((item, i) => <Tile key={item.id || i} item={item} textFn={selectedTextFn} onDeselected={onDeselected} />)}
          </div>
        </label>

      </div>
    )
  }
}

class Tile extends PureComponent {
  render() {
    const {item, textFn} = this.props
    return (
      <div className="selector-tile">
        <span>{textFn(item)}</span>
        <FontAwesomeIcon icon={faTimes} onClick={this.onDeselected} className="selector-tile-x" />
      </div>      
    )
  }

  onDeselected = e => this.props.onDeselected(this.props.item)
}

const SearchInput = props => <TextInput icon={({className}) => <FontAwesomeIcon icon={faSearch} className={className} />} placeholder="Search" {...props} />
