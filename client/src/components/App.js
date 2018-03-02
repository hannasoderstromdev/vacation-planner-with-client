// Rendering
import React, { Component } from 'react'
import { BrowserRouter, Route } from 'react-router-dom'
import { connect } from 'react-redux'
import * as actions from '../actions'

import Header from './Header'
const Landing = () => <div>Landing</div>

class App extends Component {
  componentDidMount () {
    this.props.fetchUser()
  }

  render () {
    return (
      <div>
        <BrowserRouter>
          <div>
            <Header />
            <div className="container">
              <Route component={Landing} exact path="/" />
            </div>
          </div>
        </BrowserRouter>
      </div>
    )
  }
}

export default connect(null, actions)(App)
