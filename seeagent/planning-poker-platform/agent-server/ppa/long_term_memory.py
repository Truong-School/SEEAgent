import os
import backoff
import groq
import openai
import requests

# from unsloth import FastLanguageModel

OPENAI_MODELS = ["openai/gpt-4o-mini", "openai/o1-mini", "openai/gpt-4-turbo"]
LOCAL_MODELS = ["local/Llama-3.1-8B-Instruct_r8-e2_1344-tickets_chatft-msl10000"]

class LongTermMemory:
    loaded_local_models = {}

    def __init__(
        self, system_prompt="You are a helpful assistant.", model=OPENAI_MODELS[0]
    ):
        self.system_prompt = system_prompt
        self.model = model

        self.client = self.get_client_based_on_model(model)

    # exceptions list: https://github.com/groq/groq-python/blob/8cbcbae7d8b2947587f16d0bad9bd8ef8c54c166/src/groq/__init__.py#L12-L25
    @backoff.on_exception(backoff.expo, (groq.RateLimitError, groq.APITimeoutError))
    def process(self, chat_history, temperature=0.1, max_tokens=8000):
        messages = [*chat_history]

        if len(chat_history) == 0:
            messages += [{"role": "system", "content": self.system_prompt}]

        model_name = self.model.split("/")[-1]

        if self.is_local_model(self.model):
            local_model, tokenizer = self.client
            inputs = tokenizer.apply_chat_template(
                messages,
                tokenize=True,
                add_generation_prompt=True,
                return_tensors="pt",
            ).to("cuda")
            outputs = local_model.generate(
                input_ids=inputs, max_new_tokens=max_tokens, temperature=temperature
            )

            output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

            response = None

            response_text = output_text.split("assistant")[-1].strip()
        else:
            response = self.client.chat.completions.create(
                model=model_name,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature,
            )
            response_text = response.choices[0].message.content

        messages += [{"role": "assistant", "content": response_text}]

        return messages, response

    def is_openai_model(self, model):
        return model in OPENAI_MODELS

    def is_local_model(self, model):
        return model in LOCAL_MODELS

    def get_client_based_on_model(self, model_name):
        if model_name in self.loaded_local_models:
            return self.loaded_local_models[model_name]

        if self.is_openai_model(model_name):
            return openai.OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
        elif self.is_local_model(model_name):
            pass
            # max_seq_length = 10_000 # Choose any! We auto support RoPE Scaling internally!
            # dtype = None # None for auto detection. Float16 for Tesla T4, V100, Bfloat16 for Ampere+
            # load_in_4bit = True # Use 4bit quantization to reduce memory usage. Can be False.

            # model, tokenizer = FastLanguageModel.from_pretrained(
            #     model_name = model_name.split('/')[-1],
            #     max_seq_length = max_seq_length,
            #     dtype = dtype,
            #     load_in_4bit = load_in_4bit,
            #     # token = "hf_...", # use one if using gated models like meta-llama/Llama-2-7b-hf
            # )
            # self.loaded_local_models[model_name] = (model, tokenizer)

            # return self.loaded_local_models[model_name]

        raise ValueError(f"Model {model_name} is not supported")

    def get_estimator_response(self, inputs, mode="messages", kwargs={}):
        messages = inputs.copy()

        url = os.environ.get("HF_ENDPOINTS_URL")

        headers = {"Accept": "application/json", "Content-Type": "application/json"}
        payload = {"mode": mode, "inputs": messages, "kwargs": kwargs}

        response = requests.post(url, headers=headers, json=payload)
        parsed_response = response.json()
        response_text = parsed_response.get("generated_text", "")

        messages += [{"role": "assistant", "content": response_text}]

        return messages, response
