'use strict';


class Workout {
    date = new Date()
    id = (Date.now() + '').slice(-10)
    constructor(croods, distance, duration) {
        this.croods = croods
        this.distance = distance
        this.duration = duration
    }

    _setDescription() {
        // prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]
            } ${this.date.getDate()}`;
    }

}

class Running extends Workout {
    type = "running"
    constructor(croods, distance, duration, cadence) {
        super(croods, distance, duration)
        this.cadence = cadence
        this._setDescription()
    }
    get pace() {
        return this.duration / this.distance
    }
}

class Cycling extends Workout {
    type = "cycling"

    constructor(croods, distance, duration, elevation) {
        super(croods, distance, duration)
        this.elevation = elevation
        this._setDescription()
    }
    get speed() {
        return this.distance / (this.duration / 60)
    }
}


// const run1 = new Running([12, 3], 5.2, 24, 178)
// const cyc1 = new Cycling([12, 3], 27, 95, 523)

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class App {
    #map
    #mapEvent
    #workouts = []
    constructor() {
        this._getPositionn()
        // Get data from local storage
        this._getLocalStorage();

        form.addEventListener('submit', this._newWorkout.bind(this))
        inputType.addEventListener('change', this._toggleElevationField.bind(this))
        containerWorkouts.addEventListener('click', this._moveToPopup.bind(this));
    }

    _getPositionn() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), () => {
                alert("We couldn't get your location, please enable it")
            })
        }
    }

    _loadMap(position) {
        const { latitude, longitude } = position.coords
        const coords = [latitude, longitude]
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        this.#map.on('click', this._showForm.bind(this))
        this.#workouts.forEach(work => {
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE
        form.classList.remove('hidden')
        inputDistance.focus()
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden')
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden')
    }

    _newWorkout(e) {
        const validateData = (...inputs) => inputs.every((num) => Number.isFinite(num))
        const isPostive = (...inputs) => inputs.every(num => num > 0)
        e.preventDefault()
        // Get Data from Form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const { lat, lng } = this.#mapEvent.latlng
        let workout;
        // If the type is running create run object
        if (type === 'running') {
            const cadence = +inputCadence.value
            if (
                !validateData(distance, duration, cadence) ||
                !isPostive(distance, duration, cadence)
            )
                return alert("All inputs must be numbers")
            workout = new Running([lat, lng], distance, duration, cadence)
        }

        // If the type is cycling create run object
        if (type === 'cycling') {
            const elevation = +inputCadence.value
            if (
                !validateData(distance, duration, elevation) ||
                !isPostive(distance, duration)
            )
                return alert("All inputs must be numbers")
            workout = new Cycling([lat, lng], distance, duration, elevation)

        }
        // Add new object to workout array
        this.#workouts.push(workout);

        // Render workout on map as marker
        this._renderWorkoutMarker(workout);

        // Render workout on list
        this._renderWorkout(workout);

        // Hide form + clear input fields
        this._hideForm();

        // Set local storage to all workouts
        this._setLocalStorage();

    }

    ـrenderWorkoutMarkup(workout) {
        L.marker(workout.croods).addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 250,
                    minWidth: 100,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(`${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'} ${workout.description}`)
            .openPopup();

    }

    _renderWorkout(workout) {
        let html = `
          <li class="workout workout--${workout.type}" data-id="${workout.id}">
            <h2 class="workout__title">${workout.description}</h2>
            <div class="workout__details">
              <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'
            }</span>
              <span class="workout__value">${workout.distance}</span>
              <span class="workout__unit">km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⏱</span>
              <span class="workout__value">${workout.duration}</span>
              <span class="workout__unit">min</span>
            </div>
        `;

        if (workout.type === 'running')
            html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.pace.toFixed(1)}</span>
              <span class="workout__unit">min/km</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">🦶🏼</span>
              <span class="workout__value">${workout.cadence}</span>
              <span class="workout__unit">spm</span>
            </div>
          </li>
          `;

        if (workout.type === 'cycling')
            html += `
            <div class="workout__details">
              <span class="workout__icon">⚡️</span>
              <span class="workout__value">${workout.speed.toFixed(1)}</span>
              <span class="workout__unit">km/h</span>
            </div>
            <div class="workout__details">
              <span class="workout__icon">⛰</span>
              <span class="workout__value">${workout.elevationGain}</span>
              <span class="workout__unit">m</span>
            </div>
          </li>
          `;

        form.insertAdjacentHTML('afterend', html);
    }

    _hideForm() {
        // Empty inputs
        inputDistance.value = inputDuration.value = inputCadence.value = inputElevation.value =
            '';

        form.style.display = 'none';
        form.classList.add('hidden');
        console.log(form.classList);
        setTimeout(() => (form.style.display = 'grid'), 1000);
    }

    _moveToPopup(e) {
        if (!this.#map) return;

        const workoutEl = e.target.closest('.workout');

        if (!workoutEl) return;

        const workout = this.#workouts.find(
            work => work.id === workoutEl.dataset.id
        );

        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration: 1,
            },
        });
    }
    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));

        if (!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => {
            this._renderWorkout(work);
        });
    }

    reset() {
        localStorage.removeItem('workouts');
        location.reload();
    }


}


const app = new App()

