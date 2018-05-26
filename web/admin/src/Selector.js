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
import faPlus from '@fortawesome/fontawesome-free-solid/faPlus'
import {TextInput} from '@doubledutch/react-components'
import debounce from 'lodash.debounce'
import './Selector.css'

export default class Selector extends PureComponent {
  state = {searchResults: [], isSearchFocused: false}

  render() {
    const {className, onSelected, onDeselected, searchTitle, selectedTitle, selected, selectedTextFn} = this.props
    const {isSearchFocused, searchResults} = this.state
    const nonSelectedSearchResults = searchResults.filter(x => !x.id || !selected.find(s => x.id === s.id))
    return (
      <div className={`selector-row ${className}`}>
        <div className="selector-search-container">
          <SearchInput label={searchTitle} onChange={this.onSearchChange} onFocus={this.onSearchFocus} onBlur={this.onSearchBlur} />
          <Popover show={isSearchFocused && nonSelectedSearchResults.length} className="selector-search-results horizontal space-children">
            {nonSelectedSearchResults.map((item,i) => <Tile key={item.id || i} item={item} textFn={selectedTextFn} icon={faPlus} onClick={onSelected} />)}
          </Popover>
        </div>
        <label>
          {selectedTitle}
          <div className="selector-tiles horizontal space-children">
            {selected.map((item, i) => <Tile key={item.id || i} item={item} textFn={selectedTextFn} icon={faTimes} onIconClick={onDeselected} />)}
          </div>
        </label>
      </div>
    )
  }

  onSearchFocus = e => this.setState({isSearchFocused: true})
  onSearchBlur = e => console.log(e) || setTimeout(() => this.setState({isSearchFocused: false}), 500)

  searchIndex = 0
  lastResponseSearchIndex = 0

  onSearchChange = e => this.search(e.target.value)
  search = debounce(query => {
    const searchIndex = ++this.searchIndex
    this.props.search(query).then(results => {
      if (searchIndex < this.lastResponseSearchIndex) return // Ignore stale search results that arrived out of order
      this.setState({searchResults: results.slice(0, 10)})
    }).catch(err => {
      console.error(err)
    })
  }, 300)
}

class Tile extends PureComponent {
  render() {
    const {icon, item, textFn} = this.props
    return (
      <div className={`selector-tile${this.props.onClick ? ' selector-tile-pointer':''}`} onClick={this.onClick}>
        <span>{textFn(item)}</span>
        { !!icon && <FontAwesomeIcon icon={icon} onClick={this.onIconClick} className="selector-tile-icon" /> }
      </div>      
    )
  }

  onIconClick = e => this.props.onIconClick && this.props.onIconClick(this.props.item)
  onClick = e => this.props.onClick && this.props.onClick(this.props.item)
}

const SearchInput = props => <TextInput icon={({className}) => <FontAwesomeIcon icon={faSearch} className={className} />} placeholder="Search" {...props} />
const Popover = ({children, className, show}) => (
  <div className={`${className}${show ? '':' hidden'}`}>
    {children}
  </div>
)
