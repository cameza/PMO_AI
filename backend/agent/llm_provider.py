"""
LLM Provider Abstraction Layer

Supports multiple LLM providers (Claude, OpenAI) with a unified interface.
Provider is selected via LLM_PROVIDER environment variable.
"""

import os
from abc import ABC, abstractmethod
from typing import Iterator, List, Dict, Any, Optional
from anthropic import Anthropic
from openai import OpenAI


class LLMProvider(ABC):
    """Abstract base class for LLM providers"""
    
    def __init__(self, api_key: str, model_name: str):
        self.api_key = api_key
        self.model_name = model_name
    
    @abstractmethod
    def generate(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> str:
        """
        Generate a complete response from the LLM.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            context: Retrieved context to ground the response
            temperature: Sampling temperature (0.0 to 1.0)
            
        Returns:
            Complete generated text response
        """
        pass
    
    @abstractmethod
    def stream(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> Iterator[str]:
        """
        Stream response chunks from the LLM.
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            context: Retrieved context to ground the response
            temperature: Sampling temperature (0.0 to 1.0)
            
        Yields:
            Text chunks as they are generated
        """
        pass


class ClaudeProvider(LLMProvider):
    """Anthropic Claude provider implementation"""
    
    def __init__(self, api_key: str, model_name: str = "claude-sonnet-4-20250514"):
        super().__init__(api_key, model_name)
        self.client = Anthropic(api_key=api_key)
    
    def _format_messages(self, messages: List[Dict[str, str]], context: str) -> List[Dict[str, str]]:
        """Format messages with context for Claude (XML tags)"""
        formatted_messages = []
        
        for msg in messages:
            if msg["role"] == "system":
                continue
            
            content = msg["content"]
            if msg["role"] == "user" and context and len(formatted_messages) == 0:
                content = f"""<context>
{context}
</context>

<user_query>
{content}
</user_query>

Please answer the user's query based on the provided context. If the context doesn't contain relevant information, say so clearly."""
            
            formatted_messages.append({
                "role": msg["role"],
                "content": content
            })
        
        return formatted_messages
    
    def _get_system_prompt(self, messages: List[Dict[str, str]]) -> str:
        """Extract system prompt from messages"""
        for msg in messages:
            if msg["role"] == "system":
                return msg["content"]
        return "You are a helpful AI assistant for program portfolio management."
    
    def generate(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> str:
        """Generate complete response using Claude"""
        system_prompt = self._get_system_prompt(messages)
        formatted_messages = self._format_messages(messages, context)
        
        response = self.client.messages.create(
            model=self.model_name,
            max_tokens=4096,
            temperature=temperature,
            system=system_prompt,
            messages=formatted_messages
        )
        
        return response.content[0].text
    
    def stream(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> Iterator[str]:
        """Stream response using Claude"""
        system_prompt = self._get_system_prompt(messages)
        formatted_messages = self._format_messages(messages, context)
        
        with self.client.messages.stream(
            model=self.model_name,
            max_tokens=4096,
            temperature=temperature,
            system=system_prompt,
            messages=formatted_messages
        ) as stream:
            for text in stream.text_stream:
                yield text


class OpenAIProvider(LLMProvider):
    """OpenAI GPT provider implementation"""
    
    def __init__(self, api_key: str, model_name: str = "gpt-4"):
        super().__init__(api_key, model_name)
        self.client = OpenAI(api_key=api_key)
    
    def _format_messages(self, messages: List[Dict[str, str]], context: str) -> List[Dict[str, str]]:
        """Format messages with context for OpenAI"""
        formatted_messages = []
        
        for i, msg in enumerate(messages):
            content = msg["content"]
            
            if msg["role"] == "user" and context and i == len([m for m in messages if m["role"] != "system"]) - 1:
                content = f"""Context:
{context}

User Query:
{content}

Please answer the user's query based on the provided context. If the context doesn't contain relevant information, say so clearly."""
            
            formatted_messages.append({
                "role": msg["role"],
                "content": content
            })
        
        return formatted_messages
    
    def generate(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> str:
        """Generate complete response using OpenAI"""
        formatted_messages = self._format_messages(messages, context)
        
        response = self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=4096
        )
        
        return response.choices[0].message.content
    
    def stream(self, messages: List[Dict[str, str]], context: str, temperature: float = 0.7) -> Iterator[str]:
        """Stream response using OpenAI"""
        formatted_messages = self._format_messages(messages, context)
        
        stream = self.client.chat.completions.create(
            model=self.model_name,
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=4096,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content


def get_llm_provider(provider_name: Optional[str] = None) -> LLMProvider:
    """
    Factory function to instantiate the appropriate LLM provider.
    
    Args:
        provider_name: Provider to use ('claude' or 'openai'). 
                      If None, reads from LLM_PROVIDER env var.
    
    Returns:
        Configured LLMProvider instance
        
    Raises:
        ValueError: If provider is not supported or API key is missing
    """
    if provider_name is None:
        provider_name = os.getenv("LLM_PROVIDER", "claude").lower()
    
    provider_name = provider_name.lower()
    
    if provider_name == "claude":
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required for Claude provider")
        return ClaudeProvider(api_key=api_key)
    
    elif provider_name == "openai":
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required for OpenAI provider")
        return OpenAIProvider(api_key=api_key)
    
    else:
        raise ValueError(f"Unsupported LLM provider: {provider_name}. Supported providers: claude, openai")
