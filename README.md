*Not actual, rewriting in progress*
# Setup
cd frontend -> npm install

cd backend -> (venv creation) -> pip install -r requirements.txt

# Starting the project
cd frontend -> npm run dev

cd backend -> fastapi dev main.py

# How it works
First, you have to calibrate the app by walking 10 seconds while watching the screen, and walking 10 second without watching the screen.

Then you can press Start. If you are watching the screen, the frontend will send the current image datas to the backend, which evaluates it if there is a crosswalk.

Currently it is not deployed, but the watching detection can be tested using ngrok -> it hosts the localhost publicly, so you can check it on your phone (https://ngrok.com/docs/getting-started/)

You can also test the image evaluation with a webcam, or using Phone Link on windows.

There is a test.py file in the trainResults folder, which runs an example video on the model for benchmarking purposes.
