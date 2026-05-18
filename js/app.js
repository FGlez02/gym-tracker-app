console.log('app.js cargado correctamente');
const groupSelect = document.getElementById('group');
const exerciseSelect = document.getElementById('exercise');

const lastSessionCard = document.querySelector('.last-session-card');
const lastExerciseTitle = document.querySelector('.last-session-card h3');
const lastExerciseDate = document.querySelector('.last-session-card .last-date');
const lastSetsContainer = document.querySelector('.last-sets');

const startTrainingBtn = document.getElementById('start-training-btn');
const finishTrainingBtn = document.getElementById('finish-training-btn');
const confirmFinishBtn = document.getElementById('confirm-finish-btn');

const sessionStatus = document.getElementById('session-status');
const sessionDetail = document.getElementById('session-detail');
const finishPanel = document.getElementById('finish-panel');
const trainingCategorySelect = document.getElementById('training-category');
const trainingNotesInput = document.getElementById('training-notes');

const todayDateElement = document.getElementById('today-date');

let currentTrainingId = localStorage.getItem('currentTrainingId');

window.addEventListener('load', async () => {
    setTodayDate();
    resetExerciseSelect();
    resetLastSession();
    await loadGroups();
    await loadTodayWorkout();
    await loadTrainingTypes();
    await loadActiveTraining();
});

async function loadGroups() {
    console.log('API_URL usada:', API_URL);
    console.log('URL getGroups:', `${API_URL}?action=getGroups`);   
    try {
        const data = await fetchGroups();

        console.log('Grupos recibidos:', data);

        groupSelect.innerHTML = '<option value="">Elegir grupo</option>';

        data.groups.forEach(group => {
            const option = document.createElement('option');
            option.value = group;
            option.textContent = group;
            groupSelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando grupos:', error);
    }
}

groupSelect.addEventListener('change', async () => {
    const selectedGroup = groupSelect.value;

    resetLastSession();

    if (!selectedGroup) {
        resetExerciseSelect();
        return;
    }

    exerciseSelect.innerHTML = '<option value="">Cargando ejercicios...</option>';
    exerciseSelect.disabled = true;

    try {
        const data = await fetchExercisesByGroup(selectedGroup);

        console.log('Ejercicios recibidos:', data);

        exerciseSelect.innerHTML = '<option value="">Elegir ejercicio</option>';

        data.exercises.forEach(exercise => {
            const option = document.createElement('option');
            option.value = exercise;
            option.textContent = exercise;
            exerciseSelect.appendChild(option);
        });

        exerciseSelect.disabled = false;

    } catch (error) {
        console.error('Error cargando ejercicios:', error);
        resetExerciseSelect();
    }
});

exerciseSelect.addEventListener('change', async () => {
    const selectedExercise = exerciseSelect.value;

    resetLastSession();

    if (!selectedExercise) return;

    lastExerciseTitle.textContent = 'Cargando...';

    try {
        const data = await fetchLastExercise(selectedExercise);

        console.log('Ultima sesion recibida:', data);

        if (!data.found) {
            lastExerciseTitle.textContent = 'Sin registros previos';
            lastExerciseDate.textContent = '';
            lastSetsContainer.innerHTML = '<p>Todavia no hay datos para este ejercicio.</p>';
            return;
        }

        lastExerciseTitle.textContent = data.exercise;
        lastExerciseDate.textContent = formatDate(data.fecha);

        lastSetsContainer.innerHTML = '';

        data.series.forEach(set => {
            const p = document.createElement('p');
            p.innerHTML = `Serie ${set.serie} · <strong>${set.peso} kg x ${set.reps}</strong>`;
            lastSetsContainer.appendChild(p);
        });

        setLastSessionPlaceholders(data.series);

    } catch (error) {
        console.error('Error cargando ultima sesion:', error);
        lastExerciseTitle.textContent = 'Error al cargar';
        lastExerciseDate.textContent = '';
        lastSetsContainer.innerHTML = '<p>No se pudo cargar la ultima sesion.</p>';
    }
});

function resetExerciseSelect() {
    exerciseSelect.innerHTML = '<option value="">Primero elige grupo</option>';
    exerciseSelect.disabled = true;
}

function resetLastSession() {
    lastExerciseTitle.textContent = 'Selecciona un ejercicio';
    lastExerciseDate.textContent = '';
    lastSetsContainer.innerHTML = '<p>Aqui aparecera lo que hiciste la ultima vez.</p>';
    clearSetPlaceholders();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

async function loadTodayWorkout() {
    const todayWorkoutList = document.getElementById('today-workout-list');
    const sectionTitleSpan = document.getElementById('today-total-series');

    try {
        const data = await fetchTodayWorkout();

        console.log('Entrenamiento de hoy:', data);

        todayWorkoutList.innerHTML = '';

        if (!data.found) {
            sectionTitleSpan.textContent = '0 series';

            const emptyBlock = document.createElement('div');
            emptyBlock.className = 'exercise-block';
            emptyBlock.innerHTML = `
                <h3>Sin series registradas</h3>
                <div class="set-row">
                    <span>Cuando guardes un ejercicio, aparecera aqui.</span>
                </div>
            `;

            todayWorkoutList.appendChild(emptyBlock);
            return;
        }

        sectionTitleSpan.textContent = `${data.totalSeries} series`;

        data.exercises.forEach(exercise => {
            const block = document.createElement('div');
            block.className = 'exercise-block';

            let seriesHtml = '';

            exercise.series.forEach(set => {
                seriesHtml += `
                    <div class="set-row">
                        <span>Serie ${set.serie}</span>
                        <strong>${set.peso} kg x ${set.reps}</strong>
                    </div>
                `;
            });

            block.innerHTML = `
                <h3>${exercise.exercise}</h3>
                ${seriesHtml}
            `;

            todayWorkoutList.appendChild(block);
        });

    } catch (error) {
        console.error('Error cargando entrenamiento de hoy:', error);
    }
}

const saveWorkoutBtn = document.getElementById('save-workout-btn');

saveWorkoutBtn.addEventListener('click', async () => {
    const exercise = exerciseSelect.value;
    const notes = document.getElementById('notes').value;

    if (!exercise) {
        alert('Elige un ejercicio primero.');
        return;
    }

    const weightInputs = document.querySelectorAll('.set-weight');
    const repsInputs = document.querySelectorAll('.set-reps');

    const series = [];

    weightInputs.forEach((weightInput, index) => {
        const peso = weightInput.value;
        const reps = repsInputs[index].value;

        if (peso !== '' && reps !== '') {
            series.push({
                serie: index + 1,
                peso: Number(peso),
                reps: Number(reps)
            });
        }
    });

    if (series.length === 0) {
        alert('Rellena al menos una serie.');
        return;
    }

    if (!currentTrainingId) {
        alert('Primero inicia un entrenamiento.');
        return;
    }

    const payload = {
        action: 'addWorkout',
        entrenamientoId: currentTrainingId,
        exercise: exercise,
        notes: notes,
        series: series
    };

    try {
        saveWorkoutBtn.disabled = true;
        saveWorkoutBtn.textContent = 'Guardando...';

        const result = await saveWorkout(payload);

        console.log('Resultado guardado:', result);

        if (!result.success) {
            alert('Error al guardar.');
            return;
        }

        clearWorkoutForm();
        await loadTodayWorkout();

        alert(`Guardado: ${result.insertedRows} series.`);

    } catch (error) {
        console.error('Error guardando entrenamiento:', error);
        alert('No se pudo guardar el entrenamiento.');
    } finally {
        saveWorkoutBtn.disabled = false;
        saveWorkoutBtn.textContent = 'Guardar ejercicio';
    }
});

function clearWorkoutForm() {
    document.querySelectorAll('.set-weight').forEach(input => input.value = '');
    document.querySelectorAll('.set-reps').forEach(input => input.value = '');
    document.getElementById('notes').value = '';
}

function setLastSessionPlaceholders(series) {
    const weightInputs = document.querySelectorAll('.set-weight');
    const repsInputs = document.querySelectorAll('.set-reps');

    clearSetPlaceholders();

    series.forEach((set, index) => {
        if (weightInputs[index] && repsInputs[index]) {
            weightInputs[index].placeholder = set.peso;
            repsInputs[index].placeholder = set.reps;
        }
    });
}

function clearSetPlaceholders() {
    document.querySelectorAll('.set-weight').forEach(input => {
        input.placeholder = '';
    });

    document.querySelectorAll('.set-reps').forEach(input => {
        input.placeholder = '';
    });
}

async function loadTrainingTypes() {
    try {
        const data = await fetchTrainingTypes();

        trainingCategorySelect.innerHTML = '<option value="">Elegir categoria</option>';

        data.tiposEntrenamiento.forEach(tipo => {
            const option = document.createElement('option');
            option.value = tipo;
            option.textContent = tipo;
            trainingCategorySelect.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando tipos de entrenamiento:', error);
    }
}

async function loadActiveTraining() {
    try {
        const data = await fetchActiveTraining();

        if (data.active) {
            currentTrainingId = data.entrenamientoId;
            localStorage.setItem('currentTrainingId', currentTrainingId);

            setTrainingActive(data.entrenamientoId, data.inicio);
        } else {
            currentTrainingId = null;
            localStorage.removeItem('currentTrainingId');

            setTrainingInactive();
        }

    } catch (error) {
        console.error('Error cargando entrenamiento activo:', error);
    }
}

function setTrainingActive(entrenamientoId, inicio) {
    sessionStatus.textContent = 'Entrenamiento iniciado';
    sessionDetail.textContent = `ID: ${entrenamientoId} · Inicio: ${inicio}`;

    startTrainingBtn.disabled = true;
    finishTrainingBtn.disabled = false;
}

function setTrainingInactive() {
    sessionStatus.textContent = 'Sin entrenamiento iniciado';
    sessionDetail.textContent = 'Pulsa iniciar para empezar una sesion.';

    startTrainingBtn.disabled = false;
    finishTrainingBtn.disabled = true;

    finishPanel.classList.add('hidden');
}

startTrainingBtn.addEventListener('click', async () => {
    try {
        startTrainingBtn.disabled = true;
        startTrainingBtn.textContent = 'Iniciando...';

        const result = await startTraining();

        if (!result.success) {
            alert('No se pudo iniciar el entrenamiento.');
            return;
        }

        currentTrainingId = result.entrenamientoId;
        localStorage.setItem('currentTrainingId', currentTrainingId);

        setTrainingActive(result.entrenamientoId, result.inicio);

    } catch (error) {
        console.error('Error iniciando entrenamiento:', error);
        alert('Error al iniciar entrenamiento.');
    } finally {
        startTrainingBtn.textContent = 'Iniciar entrenamiento';
    }
});

finishTrainingBtn.addEventListener('click', () => {
    finishPanel.classList.toggle('hidden');
});

confirmFinishBtn.addEventListener('click', async () => {
    const tipoEntrenamiento = trainingCategorySelect.value;
    const notes = trainingNotesInput.value;

    if (!currentTrainingId) {
        alert('No hay entrenamiento iniciado.');
        return;
    }

    if (!tipoEntrenamiento) {
        alert('Elige un tipo de entrenamiento.');
        return;
    }

    try {
        confirmFinishBtn.disabled = true;
        confirmFinishBtn.textContent = 'Finalizando...';

        const result = await finishTraining(currentTrainingId, tipoEntrenamiento, notes);

        if (!result.success) {
            alert('No se pudo finalizar el entrenamiento.');
            return;
        }

        currentTrainingId = null;
        localStorage.removeItem('currentTrainingId');

        trainingCategorySelect.value = '';
        trainingNotesInput.value = '';

        setTrainingInactive();

        alert(`Entrenamiento finalizado. Duracion: ${result.duracion}`);

    } catch (error) {
        console.error('Error finalizando entrenamiento:', error);
        alert('Error al finalizar entrenamiento.');
    } finally {
        confirmFinishBtn.disabled = false;
        confirmFinishBtn.textContent = 'Confirmar finalizacion';
    }
});

function setTodayDate() {
    const today = new Date();

    const formatted = today.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    todayDateElement.textContent =
        formatted.charAt(0).toUpperCase() + formatted.slice(1);
}