import React from 'react'
import PropTypes from 'prop-types'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { isNil, find, map, prepend, prop, propEq } from 'ramda'

import { actions, model } from 'data'
import { getData } from './selectors'
import { Remote } from 'blockchain-wallet-v4'

import Personal from './template'
import Loading from './template.loading'
import DataError from 'components/DataError'

const getCountryElements = countries => [
  {
    group: '',
    items: map(
      country => ({
        value: country,
        text: country.name
      }),
      countries
    )
  }
]

const getAddressElements = addresses => [
  {
    group: '',
    items: prepend(
      MANUAL_ADDRESS_ITEM,
      map(address => {
        const { line1, line2, postCode, city, state } = address
        return {
          value: address,
          text: `${line1} ${line2} ${postCode}, ${city}, ${state}`
        }
      }, addresses)
    )
  }
]

const { AddressPropType } = model.profile
const {
  PERSONAL_FORM,
  MANUAL_ADDRESS_ITEM
} = model.components.identityVerification

class PersonalContainer extends React.PureComponent {
  componentDidMount () {
    this.fetchData()
  }

  fetchData = () => {
    this.props.actions.fetchSupportedCountries()
    this.props.actions.fetchStates()
  }

  onPostCodeChange = (_, postCode) => {
    const { countryCode, actions, formActions } = this.props

    formActions.touch(PERSONAL_FORM, 'postCode')
    actions.fetchPossibleAddresses(postCode, countryCode)
  }

  selectAddress = (e, address) => {
    e.preventDefault()
    this.props.actions.selectAddress(address)
  }

  onCountryChange = (e, value) => {
    e.preventDefault()
    this.props.formActions.change(PERSONAL_FORM, 'country', value)
    this.props.actions.setPossibleAddresses([])
    this.props.formActions.clearFields(PERSONAL_FORM, false, false, 'state')
  }

  render () {
    const {
      initialCountryCode,
      countryCode,
      countryData,
      countryAndStateSelected,
      stateSupported,
      possibleAddresses,
      address,
      postCode,
      activeField,
      addressRefetchVisible,
      actions,
      userData,
      handleSubmit
    } = this.props
    return countryData.cata({
      Success: ({ supportedCountries, states }) => (
        <Personal
          initialValues={{
            ...userData,
            state:
              userData.country === 'US'
                ? find(propEq('code', userData.state), states) || {}
                : userData.state,
            country:
              find(propEq('code', userData.country), supportedCountries) ||
              find(propEq('code', initialCountryCode), supportedCountries)
          }}
          countryCode={countryCode}
          showStateSelect={countryCode && countryCode === 'US'}
          showStateError={countryAndStateSelected && !stateSupported}
          showPersonal={countryAndStateSelected && stateSupported}
          showAddress={
            countryAndStateSelected &&
            stateSupported &&
            !isNil(prop('line1', address))
          }
          postCode={postCode}
          supportedCountries={getCountryElements(supportedCountries)}
          states={getCountryElements(states)}
          possibleAddresses={getAddressElements(possibleAddresses)}
          addressRefetchVisible={addressRefetchVisible}
          activeField={activeField}
          onAddressSelect={this.selectAddress}
          onCountrySelect={this.onCountryChange}
          onStateSelect={actions.setPossibleAddresses.bind(null, [])}
          onPostCodeChange={this.onPostCodeChange}
          onSubmit={handleSubmit}
        />
      ),
      NotAsked: () => <Loading />,
      Loading: () => <Loading />,
      Failure: () => <DataError onClick={actions.fetchData} />
    })
  }
}

PersonalContainer.propTypes = {
  handleSubmit: PropTypes.func.isRequired,
  initialCountryCode: PropTypes.string,
  supportedCountries: PropTypes.instanceOf(Remote).isRequired,
  possibleAddresses: PropTypes.arrayOf(AddressPropType),
  countryCode: PropTypes.string,
  address: AddressPropType,
  addressRefetchVisible: PropTypes.bool
}

PersonalContainer.defaultProps = {
  addressRefetchVisible: false,
  initialCountryCode: '',
  possibleAddresses: [],
  countryCode: '',
  address: null
}

const mapDispatchToProps = dispatch => ({
  actions: bindActionCreators(
    { ...actions.components.identityVerification, ...actions.modules.profile },
    dispatch
  ),
  formActions: bindActionCreators(actions.form, dispatch)
})

export default connect(
  getData,
  mapDispatchToProps
)(PersonalContainer)
