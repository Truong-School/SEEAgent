import os
import backoff
import groq
import openai
import requests
# from unsloth import FastLanguageModel

OPENAI_MODELS = ['openai/gpt-4o-mini', 'openai/o1-mini', 'openai/gpt-4-turbo']
LOCAL_MODELS = [
    'local/Llama-3.1-8B-Instruct_r8-e2_1344-tickets_chatft-msl10000'
]

loaded_local_models = {}

# exceptions list: https://github.com/groq/groq-python/blob/8cbcbae7d8b2947587f16d0bad9bd8ef8c54c166/src/groq/__init__.py#L12-L25
@backoff.on_exception(backoff.expo, (groq.RateLimitError, groq.APITimeoutError))
def get_llm_response(
    input=None,
    chat_history=[],
    client=None,
    system_prompt="You are a helpful assistant.",
    model=OPENAI_MODELS[0],
    temperature=0.1,
    max_tokens=8000
):
    if client is None:
        client = get_client_based_on_model(model)
        
    messages = [*chat_history]
    
    if len(chat_history) == 0:
        messages += [{"role": "system", "content": system_prompt}]
    
    if input is not None:
        messages += [{"role": "user", "content": input}]

    model_name = model.split('/')[-1]
    
    if is_ollama_model(model):
        from ollama import chat
        from ollama import ChatResponse

        response: ChatResponse = chat(model=model_name, messages=messages)
        response_text = response.message.content
    elif is_local_model(model):
        local_model, tokenizer = client
        inputs = tokenizer.apply_chat_template(
            messages, 
            tokenize = True,
            add_generation_prompt = True, # Must add for generation
            return_tensors = "pt"
            ).to("cuda")
        outputs = local_model.generate(
            input_ids = inputs,
            max_new_tokens = max_tokens,
            temperature = temperature
        )
        
        output_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        response = None # FIXME: This is a hack to make the code work
        
        response_text = output_text.split("assistant")[-1].strip()
    else:
        response = client.chat.completions.create(
            model=model_name,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        response_text = response.choices[0].message.content
    
    messages += [{
        "role": "assistant",
        "content": response_text
    }]

    return messages, response

def is_openai_model(model):
    return model in OPENAI_MODELS

def is_local_model(model):
    return model in LOCAL_MODELS

def get_client_based_on_model(model_name):
    if model_name in loaded_local_models:
        return loaded_local_models[model_name]
    
    if is_openai_model(model_name):
        return openai.OpenAI(api_key=os.environ.get('OPENAI_API_KEY'))
    elif is_local_model(model_name):
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
        # loaded_local_models[model_name] = (model, tokenizer)
        
        # return loaded_local_models[model_name]
    
    raise ValueError(f"Model {model_name} is not supported")
    

def get_estimator_response(inputs, mode="messages", kwargs={}):
    messages = inputs.copy()
    
    url = os.environ.get('HF_ENDPOINTS_URL')

    headers = {
        "Accept" : "application/json",
        "Content-Type": "application/json" 
    }
    payload = {
        "mode": mode,
        "inputs": messages,
        "kwargs": kwargs
    }
    
    response = requests.post(url, headers=headers, json=payload)
    parsed_response = response.json()
    response_text = parsed_response.get('generated_text', '')

    messages += [{
        "role": "assistant",
        "content": response_text
    }]

    return messages, response
